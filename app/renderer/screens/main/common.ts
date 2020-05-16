import { ColumnProps } from 'antd/lib/table';
import { getEmojiFlag } from 'countries-list';


export const defaultTableColumns: ColumnProps<any>[] = [
  {
    title: 'Alias',
    dataIndex: 'alias',
    ellipsis: true,
    width: 200,
  },
  {
    title: 'Tier',
    dataIndex: 'tier',
    width: 100,
    defaultSortOrder: 'ascend' as 'ascend',
    sorter: ( a: any, b: any ) => a.tier - b.tier,
  },
  {
    title: 'Country',
    dataIndex: 'Country',
    width: 100,
    filters: [
      { text: 'Europe', value: 4 },
      { text: 'North America', value: 5 },
    ],
    render: ( c: any ) => getEmojiFlag( c.code ),
    onFilter: ( v: any, r: any ) => r.Country.ContinentId === v
  },
  {
    title: 'Team',
    dataIndex: 'Team',
    ellipsis: true,
    width: 200,
    render: ( t: any ) => t?.name || '',
  },
  {
    title: 'Transfer Status',
    dataIndex: 'transferListed',
    width: 150,
    filters: [
      { text: 'Transfer Listed', value: true },
      { text: 'Not Transfer Listed', value: false },
    ],
    render: ( t: any ) => t ? '✅' : '❌',
    onFilter: ( v: any, r: any ) => r.transferListed === v
  },
];
