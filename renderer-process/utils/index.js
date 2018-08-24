// @flow

export const validate = ( value: string ) => (
  value.length > 1 ? null : ''
);

export const validateSelect = ( value: string | Array<string> ) => (
  !Array.isArray( value ) ? null : ''
);