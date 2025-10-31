export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Attribute {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required: boolean;
  options?: string[];
  groupIds: string[];
}

export interface TrunkType {
  id: string;
  name: string;
  description: string;
  maxItems: number;
  features: string[];
}

export interface Store {
  id: string;
  name: string;
  description: string;
  location: string;
  capacity: number;
  type: 'warehouse' | 'office' | 'workshop' | 'archive';
}

export interface StoreSelection extends Store {
  selected: boolean;
}

export interface Status {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator';
  department: string;
}

export interface Item {
  id: string;
  name: string;
  groupId: string;
  storeId: string;
  statusId: string;
  attributes: { [key: string]: any };
  createdAt: string;
  updatedAt: string;
}

export interface MasterData {
  groups: Group[];
  attributes: Attribute[];
  trunkTypes: TrunkType[];
  stores: Store[];
  statuses: Status[];
  categories: Category[];
  users: User[];
  sampleItems: Item[];
}