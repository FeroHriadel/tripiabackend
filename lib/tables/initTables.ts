import * as cdk from 'aws-cdk-lib';
import { AppTables } from '../../types';
import { CategoriesTable } from './CategoriesTable';
import { TripsTable } from './TripsTable';
import { UsersTable } from './UsersTable';
import { FavoriteTripsTable } from './FavoriteTripsTable';
import { CommentsTable } from './CommentsTable';
import { GroupsTable } from './GroupsTable';
import { ConnectionsTable } from './ConnectionsTable';
import { PostsTable } from './PostsTable';



export function initTables(stack: cdk.Stack): AppTables {
  return {
    categoriesTable: new CategoriesTable(stack).table,
    tripsTable: new TripsTable(stack).table,
    usersTable: new UsersTable(stack).table,
    favoriteTripsTable: new FavoriteTripsTable(stack).table,
    commentsTable: new CommentsTable(stack).table,
    groupsTable: new GroupsTable(stack).table,
    connectionsTable: new ConnectionsTable(stack).table,
    postsTable: new PostsTable(stack).table
  };
}