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
import { getChat } from "../graphql/queries";
import { updateChat } from "../graphql/mutations";
const client = generateClient();
export default function ChatUpdateForm(props) {
  const {
    id: idProp,
    chat: chatModelProp,
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
  };
  const [message, setMessage] = React.useState(initialValues.message);
  const [message_in_thread, setMessage_in_thread] = React.useState(
    initialValues.message_in_thread
  );
  const [user_email, setUser_email] = React.useState(initialValues.user_email);
  const [speaker_name, setSpeaker_name] = React.useState(
    initialValues.speaker_name
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = chatRecord
      ? { ...initialValues, ...chatRecord }
      : initialValues;
    setMessage(cleanValues.message);
    setMessage_in_thread(cleanValues.message_in_thread);
    setUser_email(cleanValues.user_email);
    setSpeaker_name(cleanValues.speaker_name);
    setErrors({});
  };
  const [chatRecord, setChatRecord] = React.useState(chatModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await client.graphql({
              query: getChat.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getChat
        : chatModelProp;
      setChatRecord(record);
    };
    queryData();
  }, [idProp, chatModelProp]);
  React.useEffect(resetStateValues, [chatRecord]);
  const validations = {
    message: [{ type: "Required" }],
    message_in_thread: [],
    user_email: [],
    speaker_name: [],
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
          message_in_thread: message_in_thread ?? null,
          user_email: user_email ?? null,
          speaker_name: speaker_name ?? null,
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
            query: updateChat.replaceAll("__typename", ""),
            variables: {
              input: {
                id: chatRecord.id,
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "ChatUpdateForm")}
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
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || chatModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || chatModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
