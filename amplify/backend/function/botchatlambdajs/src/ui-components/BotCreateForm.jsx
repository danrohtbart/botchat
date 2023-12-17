/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Button, Flex, Grid, TextField } from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { createBot } from "../graphql/mutations";
const client = generateClient();
export default function BotCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    bot_name: "",
    bot_personality: "",
    bot_url: "",
  };
  const [bot_name, setBot_name] = React.useState(initialValues.bot_name);
  const [bot_personality, setBot_personality] = React.useState(
    initialValues.bot_personality
  );
  const [bot_url, setBot_url] = React.useState(initialValues.bot_url);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setBot_name(initialValues.bot_name);
    setBot_personality(initialValues.bot_personality);
    setBot_url(initialValues.bot_url);
    setErrors({});
  };
  const validations = {
    bot_name: [],
    bot_personality: [],
    bot_url: [{ type: "URL" }],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          bot_name,
          bot_personality,
          bot_url,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await client.graphql({
            query: createBot.replaceAll("__typename", ""),
            variables: {
              input: {
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "BotCreateForm")}
      {...rest}
    >
      <TextField
        label="Bot name"
        isRequired={false}
        isReadOnly={false}
        value={bot_name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              bot_name: value,
              bot_personality,
              bot_url,
            };
            const result = onChange(modelFields);
            value = result?.bot_name ?? value;
          }
          if (errors.bot_name?.hasError) {
            runValidationTasks("bot_name", value);
          }
          setBot_name(value);
        }}
        onBlur={() => runValidationTasks("bot_name", bot_name)}
        errorMessage={errors.bot_name?.errorMessage}
        hasError={errors.bot_name?.hasError}
        {...getOverrideProps(overrides, "bot_name")}
      ></TextField>
      <TextField
        label="Bot personality"
        isRequired={false}
        isReadOnly={false}
        value={bot_personality}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              bot_name,
              bot_personality: value,
              bot_url,
            };
            const result = onChange(modelFields);
            value = result?.bot_personality ?? value;
          }
          if (errors.bot_personality?.hasError) {
            runValidationTasks("bot_personality", value);
          }
          setBot_personality(value);
        }}
        onBlur={() => runValidationTasks("bot_personality", bot_personality)}
        errorMessage={errors.bot_personality?.errorMessage}
        hasError={errors.bot_personality?.hasError}
        {...getOverrideProps(overrides, "bot_personality")}
      ></TextField>
      <TextField
        label="Bot url"
        isRequired={false}
        isReadOnly={false}
        value={bot_url}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              bot_name,
              bot_personality,
              bot_url: value,
            };
            const result = onChange(modelFields);
            value = result?.bot_url ?? value;
          }
          if (errors.bot_url?.hasError) {
            runValidationTasks("bot_url", value);
          }
          setBot_url(value);
        }}
        onBlur={() => runValidationTasks("bot_url", bot_url)}
        errorMessage={errors.bot_url?.errorMessage}
        hasError={errors.bot_url?.hasError}
        {...getOverrideProps(overrides, "bot_url")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
