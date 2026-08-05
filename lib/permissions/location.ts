import * as Location from "expo-location";

/**
 * Location permission education must show BEFORE the OS prompt (PRD / PDF).
 * Call explain, then request.
 */
export async function requestForegroundLocation(): Promise<"granted" | "denied"> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return "granted";
  const result = await Location.requestForegroundPermissionsAsync();
  return result.granted ? "granted" : "denied";
}
