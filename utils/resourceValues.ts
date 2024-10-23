/*******************************************************************************************************
    Initiating some resources (e.g.: EventBus) leads to circular dependency: 
      - can't create lambdas before you have EventBus (need to know EventBus source, detail, name...)
      - can't create EventBus before you have lambdas (need to know publisher and target lambdas...)
    That is why we define those necessary values here and access them elsewhere.
    Some other values are here for grouping reasons, not circular dependency issues.
********************************************************************************************************/

import * as dotenv from 'dotenv';
dotenv.config();



export const appName = 'tripia' + '-' + process.env.STAGE;

export const imagesBucketAccessTag = 'imagesBucketAccessTag';

//delete images event bus
export const deleteImagesBusSource = [appName + 'delete.images.bus.source'];
export const deleteImagesBusDetailType = [appName + 'DeleteImagesDetailType'];
export const deleteImagesEventBusName = appName + 'DeleteImagesBus';
export const deleteImagesEventBusRuleName = appName + 'DeleteImagesBusRule';

//batch delete comments event bus
export const batchDeleteCommentsBusSource = [appName + 'batch.delete.comments.bus.source'];
export const batchDeleteCommentsBusDetailType = [appName + 'BatchDeleteCommentsDetailType']; 
export const batchDeleteCommentsEventBusName = appName + 'BatchDeleteCommentsBus';
export const batchDeleteCommentsEventBusRuleName = appName + 'BatchDeleteCommentsBusRule';

//update user's groups event bus
export const updateUserGroupsBusSource = [appName + 'user.update.groups.bus.source'];
export const updateUserGroupsBusDetailType = [appName + 'UserUpdateGroupsDetailType']; 
export const updateUserGroupsEventBusName = appName + 'UserUpdateGroupsBus';
export const updateUserGroupsEventBusRuleName = appName + 'UserUpdateGroupsBusRule';

