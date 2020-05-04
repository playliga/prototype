import React from 'react';
import { getEmojiFlag } from 'countries-list';
import { Select } from 'antd';


export default function CountrySelector( props: any ) {
  const { Option, OptGroup } = Select;

  return (
    <Select
      showSearch
      placeholder="Select a Country"
      optionFilterProp="children"
      onChange={props.onChange}
      showAction={['focus']}
    >
      {props.continents.map( ( continent: any ) => (
        <OptGroup key={continent.code} label={continent.name}>
          {continent.Countries.map( ( country: any ) => (
            <Option key={country.name} value={country.name}>
              {getEmojiFlag(country.code)}
              {country.name}
            </Option>
          ) )}
        </OptGroup>
      ) )}
    </Select>
  );
}
