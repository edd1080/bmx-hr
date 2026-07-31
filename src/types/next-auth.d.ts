import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    isHR: boolean;
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      isHR: boolean;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    isHR: boolean;
    mustChangePassword: boolean;
  }
}
