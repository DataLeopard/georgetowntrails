export const routes = [
  {
    id: 1,
    name: "San Gabriel River Trail - North",
    date: "2026-03-01",
    distance: 4.2,
    duration: "1h 10m",
    type: "trail",
    color: "#2563eb",
    coords: [
      [30.6760, -97.6789],
      [30.6790, -97.6772],
      [30.6820, -97.6750],
      [30.6855, -97.6731],
      [30.6890, -97.6710],
      [30.6920, -97.6695],
      [30.6950, -97.6678],
      [30.6980, -97.6660],
      [30.7010, -97.6645],
      [30.7040, -97.6628],
    ],
    notes: "Beautiful morning run along the river. Great views of the bluffs.",
  },
  {
    id: 2,
    name: "Berry Springs Park Loop",
    date: "2026-03-03",
    distance: 3.1,
    duration: "52m",
    type: "trail",
    color: "#16a34a",
    coords: [
      [30.7150, -97.7020],
      [30.7170, -97.7005],
      [30.7185, -97.6985],
      [30.7195, -97.6960],
      [30.7188, -97.6935],
      [30.7172, -97.6918],
      [30.7155, -97.6910],
      [30.7138, -97.6922],
      [30.7128, -97.6945],
      [30.7132, -97.6970],
      [30.7142, -97.6993],
      [30.7150, -97.7020],
    ],
    notes: "Full loop around the park. Saw deer near the creek.",
  },
  {
    id: 3,
    name: "Georgetown Lake Trail",
    date: "2026-03-05",
    distance: 5.8,
    duration: "1h 35m",
    type: "trail",
    color: "#9333ea",
    coords: [
      [30.6620, -97.7480],
      [30.6645, -97.7455],
      [30.6668, -97.7432],
      [30.6690, -97.7408],
      [30.6712, -97.7382],
      [30.6730, -97.7355],
      [30.6748, -97.7328],
      [30.6762, -97.7300],
      [30.6778, -97.7275],
      [30.6792, -97.7248],
      [30.6808, -97.7222],
      [30.6822, -97.7195],
    ],
    notes: "Lake views are stunning. Trail is well-maintained with gentle elevation.",
  },
  {
    id: 4,
    name: "Old Town Georgetown Loop",
    date: "2026-03-08",
    distance: 2.4,
    duration: "38m",
    type: "road",
    color: "#ea580c",
    coords: [
      [30.6327, -97.6772],
      [30.6342, -97.6758],
      [30.6358, -97.6745],
      [30.6372, -97.6730],
      [30.6385, -97.6718],
      [30.6375, -97.6700],
      [30.6360, -97.6695],
      [30.6345, -97.6705],
      [30.6332, -97.6718],
      [30.6320, -97.6735],
      [30.6327, -97.6772],
    ],
    notes: "Historic downtown loop. Great coffee at the square afterward.",
  },
  {
    id: 5,
    name: "Garey Park Trail",
    date: "2026-03-10",
    distance: 3.7,
    duration: "1h 02m",
    type: "trail",
    color: "#0891b2",
    coords: [
      [30.5980, -97.7250],
      [30.6005, -97.7232],
      [30.6028, -97.7215],
      [30.6050, -97.7198],
      [30.6068, -97.7180],
      [30.6082, -97.7160],
      [30.6070, -97.7140],
      [30.6052, -97.7128],
      [30.6030, -97.7135],
      [30.6010, -97.7148],
      [30.5992, -97.7165],
      [30.5980, -97.7250],
    ],
    notes: "Rolling hills through the river corridor. Worth the drive.",
  },
  {
    id: 6,
    name: "San Gabriel River - South Stretch",
    date: "2026-03-12",
    distance: 6.1,
    duration: "1h 48m",
    type: "trail",
    color: "#dc2626",
    coords: [
      [30.6480, -97.6830],
      [30.6510, -97.6812],
      [30.6542, -97.6795],
      [30.6572, -97.6778],
      [30.6600, -97.6760],
      [30.6628, -97.6742],
      [30.6655, -97.6725],
      [30.6680, -97.6708],
      [30.6705, -97.6692],
      [30.6730, -97.6675],
      [30.6755, -97.6658],
      [30.6780, -97.6642],
      [30.6805, -97.6625],
    ],
    notes: "Longest run this week. Incredible morning light on the water.",
  },
  {
    id: 7,
    name: "Rivery Park Connector",
    date: "2026-03-14",
    distance: 1.9,
    duration: "28m",
    type: "road",
    color: "#65a30d",
    coords: [
      [30.6410, -97.6920],
      [30.6428, -97.6905],
      [30.6445, -97.6890],
      [30.6460, -97.6875],
      [30.6472, -97.6858],
      [30.6482, -97.6840],
      [30.6490, -97.6822],
    ],
    notes: "Quick evening run. Good for recovery days.",
  },
];

/** Parse a YYYY-MM-DD string as local date (avoids UTC-shift timezone bug) */
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const getRoutesByPeriod = (routes) => {
  const periods = { days: {}, weeks: {}, months: {} };

  routes.forEach((route) => {
    const date = parseLocalDate(route.date);
    const dayKey = route.date;
    const weekKey = getWeekLabel(date);
    const monthKey = date.toLocaleString("default", { month: "long", year: "numeric" });

    if (!periods.days[dayKey]) periods.days[dayKey] = [];
    if (!periods.weeks[weekKey]) periods.weeks[weekKey] = [];
    if (!periods.months[monthKey]) periods.months[monthKey] = [];

    periods.days[dayKey].push(route);
    periods.weeks[weekKey].push(route);
    periods.months[monthKey].push(route);
  });

  return periods;
};

function getWeekLabel(date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("default", { month: "short", day: "numeric" });
  return `Week of ${fmt(start)} – ${fmt(end)}`;
}
