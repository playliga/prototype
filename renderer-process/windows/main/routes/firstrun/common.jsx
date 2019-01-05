// @flow
export type Field = {
  value: string,
  validateStatus: 'success' | 'error',
  errorMsg: string | null,
  pristine: boolean,
  placeholder?: string,
  icontype?: string
};

export function handleInputChange( input: Object, existing: Object ) {
  const { value, id } = input;
  const output = {};
  let invalid = false;

  if( value.length <= 4 ) {
    invalid = true;
  }

  output[ id ] = {
    ...existing, // merge with existing state
    validateStatus: invalid ? 'error' : 'success',
    errorMsg: invalid ? 'Min length: 4' : null,
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