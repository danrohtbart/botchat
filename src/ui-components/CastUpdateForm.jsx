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
import { getCast } from "../graphql/queries";
import { updateCast } from "../graphql/mutations";
const client = generateClient();
export default function CastUpdateForm(props) {
  const {
    id: idProp,
    cast: castModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    name_1: "",
    personality_1: "",
    name_2: "",
    personality_2: "",
  };
  const [name_1, setName_1] = React.useState(initialValues.name_1);
  const [personality_1, setPersonality_1] = React.useState(
    initialValues.personality_1
  );
  const [name_2, setName_2] = React.useState(initialValues.name_2);
  const [personality_2, setPersonality_2] = React.useState(
    initialValues.personality_2
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = castRecord
      ? { ...initialValues, ...castRecord }
      : initialValues;
    setName_1(cleanValues.name_1);
    setPersonality_1(cleanValues.personality_1);
    setName_2(cleanValues.name_2);
    setPersonality_2(cleanValues.personality_2);
    setErrors({});
  };
  const [castRecord, setCastRecord] = React.useState(castModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await client.graphql({
              query: getCast.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getCast
        : castModelProp;
      setCastRecord(record);
    };
    queryData();
  }, [idProp, castModelProp]);
  React.useEffect(resetStateValues, [castRecord]);
  const validations = {
    name_1: [],
    personality_1: [],
    name_2: [],
    personality_2: [],
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
          name_1: name_1 ?? null,
          personality_1: personality_1 ?? null,
          name_2: name_2 ?? null,
          personality_2: personality_2 ?? null,
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
            query: updateCast.replaceAll("__typename", ""),
            variables: {
              input: {
                id: castRecord.id,
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
      {...getOverrideProps(overrides, "CastUpdateForm")}
      {...rest}
    >
      <TextField
        label="Name 1"
        isRequired={false}
        isReadOnly={false}
        value={name_1}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name_1: value,
              personality_1,
              name_2,
              personality_2,
            };
            const result = onChange(modelFields);
            value = result?.name_1 ?? value;
          }
          if (errors.name_1?.hasError) {
            runValidationTasks("name_1", value);
          }
          setName_1(value);
        }}
        onBlur={() => runValidationTasks("name_1", name_1)}
        errorMessage={errors.name_1?.errorMessage}
        hasError={errors.name_1?.hasError}
        {...getOverrideProps(overrides, "name_1")}
      ></TextField>
      <TextField
        label="Personality 1"
        isRequired={false}
        isReadOnly={false}
        value={personality_1}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name_1,
              personality_1: value,
              name_2,
              personality_2,
            };
            const result = onChange(modelFields);
            value = result?.personality_1 ?? value;
          }
          if (errors.personality_1?.hasError) {
            runValidationTasks("personality_1", value);
          }
          setPersonality_1(value);
        }}
        onBlur={() => runValidationTasks("personality_1", personality_1)}
        errorMessage={errors.personality_1?.errorMessage}
        hasError={errors.personality_1?.hasError}
        {...getOverrideProps(overrides, "personality_1")}
      ></TextField>
      <TextField
        label="Name 2"
        isRequired={false}
        isReadOnly={false}
        value={name_2}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name_1,
              personality_1,
              name_2: value,
              personality_2,
            };
            const result = onChange(modelFields);
            value = result?.name_2 ?? value;
          }
          if (errors.name_2?.hasError) {
            runValidationTasks("name_2", value);
          }
          setName_2(value);
        }}
        onBlur={() => runValidationTasks("name_2", name_2)}
        errorMessage={errors.name_2?.errorMessage}
        hasError={errors.name_2?.hasError}
        {...getOverrideProps(overrides, "name_2")}
      ></TextField>
      <TextField
        label="Personality 2"
        isRequired={false}
        isReadOnly={false}
        value={personality_2}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name_1,
              personality_1,
              name_2,
              personality_2: value,
            };
            const result = onChange(modelFields);
            value = result?.personality_2 ?? value;
          }
          if (errors.personality_2?.hasError) {
            runValidationTasks("personality_2", value);
          }
          setPersonality_2(value);
        }}
        onBlur={() => runValidationTasks("personality_2", personality_2)}
        errorMessage={errors.personality_2?.errorMessage}
        hasError={errors.personality_2?.hasError}
        {...getOverrideProps(overrides, "personality_2")}
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
          isDisabled={!(idProp || castModelProp)}
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
              !(idProp || castModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
