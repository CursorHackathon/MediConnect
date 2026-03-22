import { appointmentsStrings } from "./appointments-translations";
import { dashboardStrings } from "./dashboard-translations";

/** Flat English string map for `t(key)`. */
export const translations: Record<string, string> = {
  ...dashboardStrings,
  ...appointmentsStrings,
};
