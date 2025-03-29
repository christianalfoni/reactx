import { state } from "bonsify";
import jsonData from "./data.json";

export type DataItem = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

export function Data() {
  const data = state<DataItem[]>(jsonData.slice(0, 1));

  // Set up interval to update a random item's limit every second
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * data.length);

    console.log("Updating", randomIndex);

    const newLimit = Number(data[randomIndex].limit) + 1 + "";
    data[randomIndex].limit = newLimit;
  }, 1000);

  return data;
}
