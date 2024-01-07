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
import { createChat } from "../graphql/mutations";
const client = generateClient();
export default function ChatCreateForm(props) {
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
    message: "",
    message_in_thread: "",
    user_email: "",
    speaker_name: "",
    thread_id: "",
  };
  const [message, setMessage] = React.useState(initialValues.message);
  const [message_in_thread, setMessage_in_thread] = React.useState(
    initialValues.message_in_thread
  );
  const [user_email, setUser_email] = React.useState(initialValues.user_email);
  const [speaker_name, setSpeaker_name] = React.useState(
    initialValues.speaker_name
  );
  const [thread_id, setThread_id] = React.useState(initialValues.thread_id);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setMessage(initialValues.message);
    setMessage_in_thread(initialValues.message_in_thread);
    setUser_email(initialValues.user_email);
    setSpeaker_name(initialValues.speaker_name);
    setThread_id(initialValues.thread_id);
    setErrors({});
  };
  const validations = {
    message: [{ type: "Required" }],
    message_in_thread: [],
    user_email: [],
    speaker_name: [],
    thread_id: [],
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
          message,
          message_in_thread,
          user_email,
          speaker_name,
          thread_id,
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
            query: createChat.replaceAll("__typename", ""),
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
      {...getOverrideProps(overrides, "ChatCreateForm")}
      {...rest}
    >
      <TextField
        label="Message"
        isRequired={true}
        isReadOnly={false}
        value={message}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              message: value,
              message_in_thread,
              user_email,
              speaker_name,
              thread_id,
            };
            const result = onChange(modelFields);
            value = result?.message ?? value;
          }
          if (errors.message?.hasError) {
            runValidationTasks("message", value);
          }
          setMessage(value);
        }}
        onBlur={() => runValidationTasks("message", message)}
        errorMessage={errors.message?.errorMessage}
        hasError={errors.message?.hasError}
        {...getOverrideProps(overrides, "message")}
      ></TextField>
      <TextField
        label="Message in thread"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={message_in_thread}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              message,
              message_in_thread: value,
              user_email,
              speaker_name,
              thread_id,
            };
            const result = onChange(modelFields);
            value = result?.message_in_thread ?? value;
          }
          if (errors.message_in_thread?.hasError) {
            runValidationTasks("message_in_thread", value);
          }
          setMessage_in_thread(value);
        }}
        onBlur={() =>
          runValidationTasks("message_in_thread", message_in_thread)
        }
        errorMessage={errors.message_in_thread?.errorMessage}
        hasError={errors.message_in_thread?.hasError}
        {...getOverrideProps(overrides, "message_in_thread")}
      ></TextField>
      <TextField
        label="User email"
        isRequired={false}
        isReadOnly={false}
        value={user_email}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              message,
              message_in_thread,
              user_email: value,
              speaker_name,
              thread_id,
            };
            const result = onChange(modelFields);
            value = result?.user_email ?? value;
          }
          if (errors.user_email?.hasError) {
            runValidationTasks("user_email", value);
          }
          setUser_email(value);
        }}
        onBlur={() => runValidationTasks("user_email", user_email)}
        errorMessage={errors.user_email?.errorMessage}
        hasError={errors.user_email?.hasError}
        {...getOverrideProps(overrides, "user_email")}
      ></TextField>
      <TextField
        label="Speaker name"
        isRequired={false}
        isReadOnly={false}
        value={speaker_name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              message,
              message_in_thread,
              user_email,
              speaker_name: value,
              thread_id,
            };
            const result = onChange(modelFields);
            value = result?.speaker_name ?? value;
          }
          if (errors.speaker_name?.hasError) {
            runValidationTasks("speaker_name", value);
          }
          setSpeaker_name(value);
        }}
        onBlur={() => runValidationTasks("speaker_name", speaker_name)}
        errorMessage={errors.speaker_name?.errorMessage}
        hasError={errors.speaker_name?.hasError}
        {...getOverrideProps(overrides, "speaker_name")}
      ></TextField>
      <TextField
        label="Thread id"
        isRequired={false}
        isReadOnly={false}
        value={thread_id}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              message,
              message_in_thread,
              user_email,
              speaker_name,
              thread_id: value,
            };
            const result = onChange(modelFields);
            value = result?.thread_id ?? value;
          }
          if (errors.thread_id?.hasError) {
            runValidationTasks("thread_id", value);
          }
          setThread_id(value);
        }}
        onBlur={() => runValidationTasks("thread_id", thread_id)}
        errorMessage={errors.thread_id?.errorMessage}
        hasError={errors.thread_id?.hasError}
        {...getOverrideProps(overrides, "thread_id")}
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
