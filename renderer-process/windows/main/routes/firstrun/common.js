// @flow
import { isEmpty } from 'validator';


export type Field = {
  value: string,
  validateStatus: 'success' | 'error',
  errorMsg: string | null,
  pristine: boolean,
  placeholder?: string,
  icontype?: string
};

export function handleInputChange( input: Object, existing: Object ) {
  const regex = existing.regex ? existing.regex : /^[a-zA-Z ]+$/;
  const errorMsg = existing.regexErrorMsg ? existing.regexErrorMsg : 'Only a-z and spaces allowed.';
  const { value, id } = input;
  const output = {};

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
    errorMsg: invalid && errorMsg,
    pristine: false,
    value,
  };

  return output;
}

export function validateForm( fields: Object ): boolean {
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

export default {};