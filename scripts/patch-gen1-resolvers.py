#!/usr/bin/env python3
"""Re-apply the Gen 2 trigger Lambda's allowlist on Gen 1's pipeline resolvers.

Why this exists:
  Gen 1's Amplify-generated pipeline resolvers contain a hardcoded
  adminRoles list in their VTL stash (see "Path B" in
  ~/.claude/.../memory/project_gen2_cutover_status.md). The Gen 1 trigger
  Lambda's name is on that list; the Gen 2 trigger Lambda is not. AppSync's
  @auth check rejects unrecognized callers even when IAM grants them
  appsync:GraphQL. During the Gen 1 → Gen 2 migration, the Gen 2 trigger
  Lambda needs to write through the Gen 1 AppSync API (so Gen 1's
  subscriptions fire and the existing frontend sees real-time updates).

  This script edits the resolvers via `aws appsync update-resolver` to add
  the Gen 2 Lambda's name to adminRoles. Any `amplify push --env <env>` on
  the Gen 1 stack will overwrite the patch — re-run this after every push.

Usage:
  python3 scripts/patch-gen1-resolvers.py            # patches dev
  python3 scripts/patch-gen1-resolvers.py --env main # patches main

Idempotent: skips resolvers that already include the Gen 2 Lambda name.
"""
import argparse
import json
import subprocess
import sys

ENV_CONFIG = {
    "dev": {
        "api_id": "bgc6zyl7obfwla3r5qiwnrhk7a",
        "gen2_lambda_name": "amplify-dr03gq88jj3a1-cla-botchattriggerlambda9B35-nYa9w6vRvdoS",
        "gen1_lambda_marker": '"botchattriggerjs-dev"',
    },
    "main": {
        "api_id": "ibuxugjs25bqrc2imosybxgkhe",
        # PR 5 cutover: this name comes from the deployed Gen 2 main Lambda.
        # Update once main env is deployed via the gen2 hosting app.
        "gen2_lambda_name": "TBD-after-main-deploys-on-gen2-hosting",
        "gen1_lambda_marker": '"botchattriggerjs-main"',
    },
}

RESOLVERS = [
    ("Mutation", "updatePersonalities"),
    ("Mutation", "createChat"),
    ("Query", "listPersonalities"),
    ("Query", "listChats"),
]


def aws_json(args):
    """Run aws cli, return parsed JSON output (or None for empty)."""
    r = subprocess.run(
        ["aws"] + args, capture_output=True, text=True, check=False
    )
    if r.returncode != 0:
        print(f"AWS CLI failed: {r.stderr}", file=sys.stderr)
        sys.exit(1)
    return json.loads(r.stdout) if r.stdout.strip() else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--env", default="dev", choices=list(ENV_CONFIG),
        help="Amplify env to patch (default: dev)",
    )
    args = parser.parse_args()
    cfg = ENV_CONFIG[args.env]

    if cfg["gen2_lambda_name"].startswith("TBD"):
        print(
            f"ERROR: gen2_lambda_name for env={args.env} is unset. "
            f"Update ENV_CONFIG in this script.",
            file=sys.stderr,
        )
        sys.exit(2)

    api_id = cfg["api_id"]
    gen2_fn = cfg["gen2_lambda_name"]
    marker = cfg["gen1_lambda_marker"]

    print(f"Patching {args.env} (api {api_id}) → adding {gen2_fn}")

    for type_name, field_name in RESOLVERS:
        print(f"\n=== {type_name}.{field_name} ===")
        res = aws_json([
            "appsync", "get-resolver",
            "--api-id", api_id,
            "--type-name", type_name,
            "--field-name", field_name,
            "--output", "json",
        ])["resolver"]

        template = res["requestMappingTemplate"]
        if gen2_fn in template:
            print(f"  Already patched, skipping")
            continue
        if marker not in template:
            print(f"  ERROR: marker {marker} not in template — abort")
            continue

        new_template = template.replace(marker, f'{marker},"{gen2_fn}"')
        pipeline_functions = res["pipelineConfig"]["functions"]

        aws_json([
            "appsync", "update-resolver",
            "--api-id", api_id,
            "--type-name", type_name,
            "--field-name", field_name,
            "--kind", "PIPELINE",
            "--pipeline-config", json.dumps({"functions": pipeline_functions}),
            "--request-mapping-template", new_template,
            "--response-mapping-template", res["responseMappingTemplate"],
            "--output", "json",
        ])
        # Verify
        check = aws_json([
            "appsync", "get-resolver",
            "--api-id", api_id,
            "--type-name", type_name,
            "--field-name", field_name,
            "--output", "json",
        ])["resolver"]
        ok = gen2_fn in check["requestMappingTemplate"]
        print(f"  {'✓ patched' if ok else '✗ verification failed'}")


if __name__ == "__main__":
    main()
