import { Role } from 'src/roles/enums/role.enum';

export class UserEntityMock {
  id: number;
  username: string;
  password: string;
  email: string;
  enabled: boolean;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}
