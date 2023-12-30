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
export declare type CastUpdateFormInputValues = {
    name_1?: string;
    personality_1?: string;
    name_2?: string;
    personality_2?: string;
};
export declare type CastUpdateFormValidationValues = {
    name_1?: ValidationFunction<string>;
    personality_1?: ValidationFunction<string>;
    name_2?: ValidationFunction<string>;
    personality_2?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CastUpdateFormOverridesProps = {
    CastUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name_1?: PrimitiveOverrideProps<TextFieldProps>;
    personality_1?: PrimitiveOverrideProps<TextFieldProps>;
    name_2?: PrimitiveOverrideProps<TextFieldProps>;
    personality_2?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CastUpdateFormProps = React.PropsWithChildren<{
    overrides?: CastUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    cast?: any;
    onSubmit?: (fields: CastUpdateFormInputValues) => CastUpdateFormInputValues;
    onSuccess?: (fields: CastUpdateFormInputValues) => void;
    onError?: (fields: CastUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CastUpdateFormInputValues) => CastUpdateFormInputValues;
    onValidate?: CastUpdateFormValidationValues;
} & React.CSSProperties>;
export default function CastUpdateForm(props: CastUpdateFormProps): React.ReactElement;
