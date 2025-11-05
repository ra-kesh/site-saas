import { cookies as getCookies } from "next/headers";

interface CookieProps {
  prefix: string;
}

interface GenerateAuthCookieProps extends CookieProps {
  value: string;
}

const COOKIE_PATH = "/";

const getCookieOptions = () =>
  process.env.NODE_ENV !== "development"
    ? {
        sameSite: "none" as const,
        domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
        secure: true,
      }
    : undefined;

export const generateAuthCookie = async ({
  prefix,
  value,
}: GenerateAuthCookieProps) => {
  const cookies = await getCookies();

  cookies.set({
    name: `${prefix}-token`,
    value,
    httpOnly: true,
    path: COOKIE_PATH,
    ...getCookieOptions(),
  });
};

export const clearAuthCookie = async ({ prefix }: CookieProps) => {
  const cookies = await getCookies();
  const name = `${prefix}-token`;

  const options = getCookieOptions();

  cookies.set({
    name,
    value: "",
    httpOnly: true,
    path: COOKIE_PATH,
    expires: new Date(0),
    ...(options ?? {}),
  });
};
