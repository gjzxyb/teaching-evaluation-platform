import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

export type OrgType =
  | 'school'
  | 'campus'
  | 'college'
  | 'grade'
  | 'class'
  | 'teaching_group';

export interface OrgUnit {
  id: string;
  tenantId: string;
  parentId?: string;
  orgType: OrgType;
  orgCode: string;
  orgName: string;
  sortNo: number;
  status: 0 | 1;
}

export interface OrgTreeNode extends OrgUnit {
  children: OrgTreeNode[];
}

export interface CreateOrgUnitRequest {
  tenantId: string;
  parentId?: string;
  orgType: OrgType;
  orgCode: string;
  orgName: string;
}

const orgUnits: OrgUnit[] = [
  {
    id: 'org-school-demo',
    tenantId: 'demo',
    orgType: 'school',
    orgCode: 'demo-school',
    orgName: 'Demo School',
    sortNo: 1,
    status: 1
  },
  {
    id: 'org-college-demo',
    tenantId: 'demo',
    parentId: 'org-school-demo',
    orgType: 'college',
    orgCode: 'computer-college',
    orgName: '计算机学院',
    sortNo: 1,
    status: 1
  },
  {
    id: 'org-class-demo',
    tenantId: 'demo',
    parentId: 'org-college-demo',
    orgType: 'class',
    orgCode: 'class-2026-1',
    orgName: '2026 级 1 班',
    sortNo: 1,
    status: 1
  }
];

@Injectable()
export class OrgService {
  getOrgTree(tenantId: string): OrgTreeNode[] {
    const tenantOrgs = orgUnits.filter((org) => org.tenantId === tenantId && org.status === 1);
    return this.buildTree(tenantOrgs);
  }

  createOrgUnit(input: CreateOrgUnitRequest): OrgUnit {
    if (!input.orgCode.trim()) {
      throw new BadRequestException('orgCode is required');
    }
    if (!input.orgName.trim()) {
      throw new BadRequestException('orgName is required');
    }

    if (input.parentId) {
      const parent = orgUnits.find((org) => org.tenantId === input.tenantId && org.id === input.parentId);
      if (!parent) {
        throw new NotFoundException('Parent organization not found');
      }
    }

    const duplicate = orgUnits.find((org) => org.tenantId === input.tenantId && org.orgCode === input.orgCode);
    if (duplicate) {
      throw new BadRequestException('orgCode already exists');
    }

    const org: OrgUnit = {
      id: `org-${input.orgCode}`,
      tenantId: input.tenantId,
      parentId: input.parentId,
      orgType: input.orgType,
      orgCode: input.orgCode,
      orgName: input.orgName,
      sortNo: orgUnits.length + 1,
      status: 1
    };
    orgUnits.push(org);
    return org;
  }

  private buildTree(units: OrgUnit[]): OrgTreeNode[] {
    const nodeMap = new Map<string, OrgTreeNode>();
    for (const unit of units) {
      nodeMap.set(unit.id, { ...unit, children: [] });
    }

    const roots: OrgTreeNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots.sort((left, right) => left.sortNo - right.sortNo);
  }
}
