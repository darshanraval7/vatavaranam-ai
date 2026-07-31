// Third-party zero-backend counter API
const NAMESPACE = "vatavaranam-ai-app-2026"; // Tamari unique key
const KEY = "total-visits";

// 1. Jyare website khule tyare visit count +1 karva mate
export const incrementVisitCount = async () => {
  try {
    const res = await fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${KEY}/up`);
    const data = await res.json();
    return data.count;
  } catch (err) {
    console.error("Counter API Up Error:", err);
    return null;
  }
};

// 2. Secret Page par total count GET karva mate (Count vadhya vagar)
export const getVisitCount = async () => {
  try {
    const res = await fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${KEY}/`);
    const data = await res.json();
    return data.count;
  } catch (err) {
    console.error("Counter API Get Error:", err);
    return null;
  }
};