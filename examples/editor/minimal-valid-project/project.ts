import { createAuthoringProject } from '../../../src/editor/model/authoringProject'
import { createMinimalTemplateDraft } from '../../../src/editor/model/caseDraft'

export const minimalValidProject = createAuthoringProject('最小可玩模板工程', createMinimalTemplateDraft(), '2032-06-18T09:00:00.000Z')
minimalValidProject.projectId = 'example-minimal-spare-key'
minimalValidProject.createdAt = '2032-06-18T09:00:00.000Z'
minimalValidProject.updatedAt = '2032-06-18T09:00:00.000Z'
minimalValidProject.lastOpenedAt = '2032-06-18T09:00:00.000Z'
