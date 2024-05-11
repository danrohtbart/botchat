/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, HeadingProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type PersonalitiesCreateFormInputValues = {
    name_1?: string;
    personality_1?: string;
    name_2?: string;
    personality_2?: string;
};
export declare type PersonalitiesCreateFormValidationValues = {
    name_1?: ValidationFunction<string>;
    personality_1?: ValidationFunction<string>;
    name_2?: ValidationFunction<string>;
    personality_2?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type PersonalitiesCreateFormOverridesProps = {
    PersonalitiesCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    SectionalElement0?: PrimitiveOverrideProps<HeadingProps>;
    name_1?: PrimitiveOverrideProps<TextFieldProps>;
    personality_1?: PrimitiveOverrideProps<TextAreaFieldProps>;
    name_2?: PrimitiveOverrideProps<TextFieldProps>;
    personality_2?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type PersonalitiesCreateFormProps = React.PropsWithChildren<{
    overrides?: PersonalitiesCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: PersonalitiesCreateFormInputValues) => PersonalitiesCreateFormInputValues;
    onSuccess?: (fields: PersonalitiesCreateFormInputValues) => void;
    onError?: (fields: PersonalitiesCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: PersonalitiesCreateFormInputValues) => PersonalitiesCreateFormInputValues;
    onValidate?: PersonalitiesCreateFormValidationValues;
} & React.CSSProperties>;
export default function PersonalitiesCreateForm(props: PersonalitiesCreateFormProps): React.ReactElement;
