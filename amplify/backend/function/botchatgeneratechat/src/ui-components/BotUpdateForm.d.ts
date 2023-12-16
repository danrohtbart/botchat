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
export declare type BotUpdateFormInputValues = {
    bot_name?: string;
    bot_personality?: string;
    bot_url?: string;
};
export declare type BotUpdateFormValidationValues = {
    bot_name?: ValidationFunction<string>;
    bot_personality?: ValidationFunction<string>;
    bot_url?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type BotUpdateFormOverridesProps = {
    BotUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    bot_name?: PrimitiveOverrideProps<TextFieldProps>;
    bot_personality?: PrimitiveOverrideProps<TextAreaFieldProps>;
    bot_url?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type BotUpdateFormProps = React.PropsWithChildren<{
    overrides?: BotUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    bot?: any;
    onSubmit?: (fields: BotUpdateFormInputValues) => BotUpdateFormInputValues;
    onSuccess?: (fields: BotUpdateFormInputValues) => void;
    onError?: (fields: BotUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: BotUpdateFormInputValues) => BotUpdateFormInputValues;
    onValidate?: BotUpdateFormValidationValues;
} & React.CSSProperties>;
export default function BotUpdateForm(props: BotUpdateFormProps): React.ReactElement;
