/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type BotCreateFormInputValues = {
    bot_order?: number;
    bot_name?: string;
    bot_personality?: string;
};
export declare type BotCreateFormValidationValues = {
    bot_order?: ValidationFunction<number>;
    bot_name?: ValidationFunction<string>;
    bot_personality?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type BotCreateFormOverridesProps = {
    BotCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    bot_order?: PrimitiveOverrideProps<TextFieldProps>;
    bot_name?: PrimitiveOverrideProps<TextFieldProps>;
    bot_personality?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type BotCreateFormProps = React.PropsWithChildren<{
    overrides?: BotCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: BotCreateFormInputValues) => BotCreateFormInputValues;
    onSuccess?: (fields: BotCreateFormInputValues) => void;
    onError?: (fields: BotCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: BotCreateFormInputValues) => BotCreateFormInputValues;
    onValidate?: BotCreateFormValidationValues;
} & React.CSSProperties>;
export default function BotCreateForm(props: BotCreateFormProps): React.ReactElement;
