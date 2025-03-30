import { reactive } from "bonsify";
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
  const data = reactive<DataItem[]>(jsonData.slice(0, 1000));

  // Set up interval to update a random item's limit every second
  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * data.length);

    const newLimit = Number(data[randomIndex].limit) + 1 + "";
    data[randomIndex].limit = newLimit;
    data[randomIndex].reviewer = "Eddie" + newLimit;
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    alert("DONE!");
  }, 1000);

  return data;
}
