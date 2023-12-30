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
export declare type PersonalitiesUpdateFormInputValues = {
    name_1?: string;
    personality_1?: string;
    name_2?: string;
    personality_2?: string;
};
export declare type PersonalitiesUpdateFormValidationValues = {
    name_1?: ValidationFunction<string>;
    personality_1?: ValidationFunction<string>;
    name_2?: ValidationFunction<string>;
    personality_2?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type PersonalitiesUpdateFormOverridesProps = {
    PersonalitiesUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name_1?: PrimitiveOverrideProps<TextFieldProps>;
    personality_1?: PrimitiveOverrideProps<TextFieldProps>;
    name_2?: PrimitiveOverrideProps<TextFieldProps>;
    personality_2?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type PersonalitiesUpdateFormProps = React.PropsWithChildren<{
    overrides?: PersonalitiesUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    personalities?: any;
    onSubmit?: (fields: PersonalitiesUpdateFormInputValues) => PersonalitiesUpdateFormInputValues;
    onSuccess?: (fields: PersonalitiesUpdateFormInputValues) => void;
    onError?: (fields: PersonalitiesUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: PersonalitiesUpdateFormInputValues) => PersonalitiesUpdateFormInputValues;
    onValidate?: PersonalitiesUpdateFormValidationValues;
} & React.CSSProperties>;
export default function PersonalitiesUpdateForm(props: PersonalitiesUpdateFormProps): React.ReactElement;
