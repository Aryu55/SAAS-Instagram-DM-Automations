import { onboardUser } from "@/actions/user";
import { redirect } from "next/navigation";

type Props = {};

async function Page({}: Props) {
  console.log("[AUTH TRACE] Dashboard Page: loading root dashboard page. Calling onboardUser...");
  const user = await onboardUser();
  console.log("[AUTH TRACE] Dashboard Page: onboardUser resolved with status:", user.status, "data:", user.data);

  if (user.status === 200 || user.status === 201) {
    const destination = `/dashboard/${user.data?.firstname}${user.data?.lastname}`;
    console.log("[AUTH TRACE] Dashboard Page: Redirecting to dynamic path:", destination);
    return redirect(destination);
  }

  console.log("[AUTH TRACE] Dashboard Page: Status check failed. Redirecting back to /sign-in");
  return redirect("/sign-in");
}

export default Page;
