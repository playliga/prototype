import React from 'react';
import { isEmpty } from 'validator';


export const FormContext = React.createContext({});


export interface Field {
  value: string;
  validateStatus: 'success' | 'error';
  errorMsg: string | null;
  pristine: boolean;
  placeholder?: string;
  icon?: any;
  regex?: RegExp;
  regexErrorMsg?: string;
}


export function handleInputChange( input: HTMLInputElement, existing: Field ) {
  const regex = existing.regex ? existing.regex : /^[a-zA-Z ]+$/;
  const errorMsg = existing.regexErrorMsg ? existing.regexErrorMsg : 'Only a-z and spaces allowed.';
  const { value, id } = input;
  const output: {
    [x: string]: Field;
  } = {};

  let invalid = false;

  if( isEmpty( value, { ignore_whitespace: true }) ) {
    invalid = true;
  }

  if( !invalid && !regex.test( value ) ) {
    invalid = true;
  }

  output[ id ] = {
    ...existing, // merge with existing state
    validateStatus: invalid ? 'error' : 'success',
    errorMsg: invalid ? errorMsg : null,
    pristine: false,
    value,
  };

  return output;
}


export function validateForm( fields: {[x: string]: Field }): boolean {
  let invalid = false;

  // loop through the fields and validate them
  // if the field is pristine consider it invalid as well
  // @TODO get this array dynamically
  const ids = Object.keys( fields );

  for( let i = 0; i < ids.length; i++ ) {
    const field = fields[ ids[ i ] ];
    invalid = field.validateStatus === 'error' || field.pristine;

    // bail if we have an invalid field
    if( invalid ) {
      break;
    }
  }

  return invalid;
}
