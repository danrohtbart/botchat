/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type HeadlineUpdateFormInputValues = {
    message?: string;
};
export declare type HeadlineUpdateFormValidationValues = {
    message?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type HeadlineUpdateFormOverridesProps = {
    HeadlineUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    message?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type HeadlineUpdateFormProps = React.PropsWithChildren<{
    overrides?: HeadlineUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    headline?: any;
    onSubmit?: (fields: HeadlineUpdateFormInputValues) => HeadlineUpdateFormInputValues;
    onSuccess?: (fields: HeadlineUpdateFormInputValues) => void;
    onError?: (fields: HeadlineUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: HeadlineUpdateFormInputValues) => HeadlineUpdateFormInputValues;
    onValidate?: HeadlineUpdateFormValidationValues;
} & React.CSSProperties>;
export default function HeadlineUpdateForm(props: HeadlineUpdateFormProps): React.ReactElement;
