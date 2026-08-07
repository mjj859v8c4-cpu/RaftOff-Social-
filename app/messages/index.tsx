import { Redirect } from "expo-router";

/** Messaging now lives in the bottom tabs (it replaced the Anchor tab). */
export default function MessagesIndexRedirect() {
  return <Redirect href={"/(tabs)/messages" as never} />;
}
