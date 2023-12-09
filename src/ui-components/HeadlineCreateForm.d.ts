/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps } from "@aws-amplify/ui-react";
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
export declare type HeadlineCreateFormInputValues = {
    message?: string;
};
export declare type HeadlineCreateFormValidationValues = {
    message?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type HeadlineCreateFormOverridesProps = {
    HeadlineCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    message?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type HeadlineCreateFormProps = React.PropsWithChildren<{
    overrides?: HeadlineCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: HeadlineCreateFormInputValues) => HeadlineCreateFormInputValues;
    onSuccess?: (fields: HeadlineCreateFormInputValues) => void;
    onError?: (fields: HeadlineCreateFormInputValues, errorMessage: string) => void;
    onCancel?: () => void;
    onChange?: (fields: HeadlineCreateFormInputValues) => HeadlineCreateFormInputValues;
    onValidate?: HeadlineCreateFormValidationValues;
} & React.CSSProperties>;
export default function HeadlineCreateForm(props: HeadlineCreateFormProps): React.ReactElement;
