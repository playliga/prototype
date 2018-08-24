// @flow
import React from 'react';
import { asField } from 'informed';
import Select from 'react-select';

const InformedSelect = asField( ({ ...props }) => (
  <Select {...props} />
) );

export default InformedSelect;