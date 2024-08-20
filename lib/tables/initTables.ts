import * as cdk from 'aws-cdk-lib';
import { AppTables } from '../../types';
import { CategoriesTable } from './CategoriesTable';



export function initTables(stack: cdk.Stack): AppTables {
  return {
    categoriesTable: new CategoriesTable(stack).table
  }
}