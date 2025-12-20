
import { UserRole, VerificationStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      username: string | null;
      role: UserRole;
      isVerified: boolean;
      verificationStatus: VerificationStatus;
    }
  }
}
