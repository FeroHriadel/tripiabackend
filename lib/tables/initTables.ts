import * as cdk from 'aws-cdk-lib';
import { AppTables } from '../../types';
import { CategoriesTable } from './CategoriesTable';
import { TripsTable } from './TripsTable';



export function initTables(stack: cdk.Stack): AppTables {
  return {
    categoriesTable: new CategoriesTable(stack).table,
    tripsTable: new TripsTable(stack).table
  };
}