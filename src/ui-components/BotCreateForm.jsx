/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  TextAreaField,
  TextField,
} from "@aws-amplify/ui-react";
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
    bot_order: "",
    bot_name: "",
    bot_personality: "",
  };
  const [bot_order, setBot_order] = React.useState(initialValues.bot_order);
  const [bot_name, setBot_name] = React.useState(initialValues.bot_name);
  const [bot_personality, setBot_personality] = React.useState(
    initialValues.bot_personality
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setBot_order(initialValues.bot_order);
    setBot_name(initialValues.bot_name);
    setBot_personality(initialValues.bot_personality);
    setErrors({});
  };
  const validations = {
    bot_order: [
      { type: "Required" },
      {
        type: "EqualTo",
        numValues: [1, 2],
        validationMessage: 'The value must be equal to "1" or "2"',
      },
    ],
    bot_name: [],
    bot_personality: [],
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
          bot_order,
          bot_name,
          bot_personality,
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
        label="Bot order"
        isRequired={true}
        isReadOnly={false}
        placeholder="1"
        type="number"
        step="any"
        value={bot_order}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              bot_order: value,
              bot_name,
              bot_personality,
            };
            const result = onChange(modelFields);
            value = result?.bot_order ?? value;
          }
          if (errors.bot_order?.hasError) {
            runValidationTasks("bot_order", value);
          }
          setBot_order(value);
        }}
        onBlur={() => runValidationTasks("bot_order", bot_order)}
        errorMessage={errors.bot_order?.errorMessage}
        hasError={errors.bot_order?.hasError}
        {...getOverrideProps(overrides, "bot_order")}
      ></TextField>
      <TextField
        label="Bot name"
        isRequired={false}
        isReadOnly={false}
        placeholder="Jim"
        value={bot_name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              bot_order,
              bot_name: value,
              bot_personality,
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
      <TextAreaField
        label="Bot personality"
        isRequired={false}
        isReadOnly={false}
        placeholder="You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments."
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              bot_order,
              bot_name,
              bot_personality: value,
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
      ></TextAreaField>
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
