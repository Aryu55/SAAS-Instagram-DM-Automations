"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useQueryAutomation } from "@/hooks/user-queries";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/actions/contacts/queries";

type Props = {
  activeTab: "overview" | "ai" | "keywords";
  timeRange: "24h" | "7d" | "30d";
};

// Interactive datasets representing realistic trends
const datasets = {
  overview: {
    "24h": [
      { time: "00:00", value: 8 },
      { time: "04:00", value: 14 },
      { time: "08:00", value: 38 },
      { time: "12:00", value: 65 },
      { time: "16:00", value: 52 },
      { time: "20:00", value: 29 },
      { time: "24:00", value: 12 },
    ],
    "7d": [
      { time: "Mon", value: 145 },
      { time: "Tue", value: 182 },
      { time: "Wed", value: 158 },
      { time: "Thu", value: 244 },
      { time: "Fri", value: 290 },
      { time: "Sat", value: 215 },
      { time: "Sun", value: 170 },
    ],
    "30d": [
      { time: "Day 1-5", value: 680 },
      { time: "Day 6-10", value: 840 },
      { time: "Day 11-15", value: 1120 },
      { time: "Day 16-20", value: 980 },
      { time: "Day 21-25", value: 1290 },
      { time: "Day 26-30", value: 1420 },
    ],
  },
  ai: {
    "24h": [
      { time: "00:00", value: 5 },
      { time: "04:00", value: 10 },
      { time: "08:00", value: 28 },
      { time: "12:00", value: 48 },
      { time: "16:00", value: 38 },
      { time: "20:00", value: 20 },
      { time: "24:00", value: 8 },
    ],
    "7d": [
      { time: "Mon", value: 95 },
      { time: "Tue", value: 128 },
      { time: "Wed", value: 114 },
      { time: "Thu", value: 185 },
      { time: "Fri", value: 228 },
      { time: "Sat", value: 154 },
      { time: "Sun", value: 112 },
    ],
    "30d": [
      { time: "Day 1-5", value: 450 },
      { time: "Day 6-10", value: 580 },
      { time: "Day 11-15", value: 820 },
      { time: "Day 16-20", value: 690 },
      { time: "Day 21-25", value: 940 },
      { time: "Day 26-30", value: 1050 },
    ],
  },
  keywords: {
    "24h": [
      { time: "00:00", value: 3 },
      { time: "04:00", value: 4 },
      { time: "08:00", value: 10 },
      { time: "12:00", value: 17 },
      { time: "16:00", value: 14 },
      { time: "20:00", value: 9 },
      { time: "24:00", value: 4 },
    ],
    "7d": [
      { time: "Mon", value: 50 },
      { time: "Tue", value: 54 },
      { time: "Wed", value: 44 },
      { time: "Thu", value: 59 },
      { time: "Fri", value: 62 },
      { time: "Sat", value: 61 },
      { time: "Sun", value: 58 },
    ],
    "30d": [
      { time: "Day 1-5", value: 230 },
      { time: "Day 6-10", value: 260 },
      { time: "Day 11-15", value: 300 },
      { time: "Day 16-20", value: 290 },
      { time: "Day 21-25", value: 350 },
      { time: "Day 26-30", value: 370 },
    ],
  },
};

const themeConfigs = {
  overview: {
    color: "#3b82f6",
    gradientId: "colorOverview",
    label: "Total Interactions",
  },
  ai: {
    color: "#a855f7",
    gradientId: "colorAi",
    label: "AI Replies",
  },
  keywords: {
    color: "#14b8a6",
    gradientId: "colorKeywords",
    label: "Keyword Triggers",
  },
};

function Chart({ activeTab = "overview", timeRange = "7d" }: Props) {
  const tab = activeTab || "overview";
  const range = timeRange || "7d";

  const { data: automationsData } = useQueryAutomation();
  const { data: contactsData } = useQuery({
    queryKey: ["contacts-list"],
    queryFn: () => getContacts(),
  });

  const automations = automationsData?.data || [];
  const contacts = contactsData?.status === 200 ? (contactsData.data as any[]) : [];

  const totalContacts = contacts.length;
  const commentsCount = automations.reduce((current, next) => {
    return current + (next.listener?.commentCount || 0);
  }, 0);

  const dmsCount = automations.reduce((current, next) => {
    return current + (next.listener?.dmCount || 0);
  }, 0);

  const totalOverviewCount = totalContacts + commentsCount + dmsCount;

  const zeroDatasets = {
    "24h": [
      { time: "00:00", value: 0 },
      { time: "04:00", value: 0 },
      { time: "08:00", value: 0 },
      { time: "12:00", value: 0 },
      { time: "16:00", value: 0 },
      { time: "20:00", value: 0 },
      { time: "24:00", value: 0 },
    ],
    "7d": [
      { time: "Mon", value: 0 },
      { time: "Tue", value: 0 },
      { time: "Wed", value: 0 },
      { time: "Thu", value: 0 },
      { time: "Fri", value: 0 },
      { time: "Sat", value: 0 },
      { time: "Sun", value: 0 },
    ],
    "30d": [
      { time: "Day 1-5", value: 0 },
      { time: "Day 6-10", value: 0 },
      { time: "Day 11-15", value: 0 },
      { time: "Day 16-20", value: 0 },
      { time: "Day 21-25", value: 0 },
      { time: "Day 26-30", value: 0 },
    ],
  };

  const getDynamicChartData = () => {
    let baseValue = 0;
    if (tab === "overview") baseValue = totalOverviewCount;
    else if (tab === "ai") baseValue = dmsCount;
    else if (tab === "keywords") baseValue = commentsCount;

    if (baseValue === 0) {
      return zeroDatasets[range];
    }

    const contactDates = contacts.map(c => new Date(c.createdAt));

    if (range === "24h") {
      const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"];
      const dataPoints = hours.map((h, i) => {
        if (contactDates.length > 0) {
          const bucketHour = parseInt(h.split(":")[0]);
          const count = contactDates.filter(d => {
            const hr = d.getHours();
            return hr >= bucketHour && hr < bucketHour + 4;
          }).length;
          return { time: h, value: count };
        } else {
          const values = [
            Math.floor(baseValue * 0.05),
            Math.floor(baseValue * 0.1),
            Math.floor(baseValue * 0.15),
            Math.floor(baseValue * 0.2),
            Math.floor(baseValue * 0.25),
            Math.floor(baseValue * 0.15),
            Math.floor(baseValue * 0.1),
          ];
          return { time: h, value: values[i] || 0 };
        }
      });

      if (contactDates.length > 0) {
        const sum = dataPoints.reduce((acc, curr) => acc + curr.value, 0);
        if (sum > 0) {
          dataPoints.forEach(p => {
            p.value = Math.round((p.value / sum) * baseValue);
          });
        } else {
          dataPoints[4].value = Math.floor(baseValue * 0.3);
          dataPoints[5].value = Math.floor(baseValue * 0.4);
          dataPoints[6].value = Math.floor(baseValue * 0.3);
        }
      }
      return dataPoints;
    }

    if (range === "7d") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dataPoints = days.map((d, i) => {
        if (contactDates.length > 0) {
          const dayMap = [1, 2, 3, 4, 5, 6, 0];
          const count = contactDates.filter(date => date.getDay() === dayMap[i]).length;
          return { time: d, value: count };
        } else {
          const values = [
            Math.floor(baseValue * 0.1),
            Math.floor(baseValue * 0.12),
            Math.floor(baseValue * 0.15),
            Math.floor(baseValue * 0.18),
            Math.floor(baseValue * 0.2),
            Math.floor(baseValue * 0.15),
            Math.floor(baseValue * 0.1),
          ];
          return { time: d, value: values[i] || 0 };
        }
      });

      if (contactDates.length > 0) {
        const sum = dataPoints.reduce((acc, curr) => acc + curr.value, 0);
        if (sum > 0) {
          dataPoints.forEach(p => {
            p.value = Math.round((p.value / sum) * baseValue);
          });
        } else {
          dataPoints[4].value = Math.floor(baseValue * 0.3);
          dataPoints[5].value = Math.floor(baseValue * 0.4);
          dataPoints[6].value = Math.floor(baseValue * 0.3);
        }
      }
      return dataPoints;
    }

    if (range === "30d") {
      const intervals = ["Day 1-5", "Day 6-10", "Day 11-15", "Day 16-20", "Day 21-25", "Day 26-30"];
      const dataPoints = intervals.map((int, i) => {
        if (contactDates.length > 0) {
          const count = contactDates.filter(date => {
            const day = date.getDate();
            const startDay = i * 5 + 1;
            const endDay = startDay + 4;
            return day >= startDay && day <= endDay;
          }).length;
          return { time: int, value: count };
        } else {
          const values = [
            Math.floor(baseValue * 0.1),
            Math.floor(baseValue * 0.15),
            Math.floor(baseValue * 0.2),
            Math.floor(baseValue * 0.18),
            Math.floor(baseValue * 0.22),
            Math.floor(baseValue * 0.15),
          ];
          return { time: int, value: values[i] || 0 };
        }
      });

      if (contactDates.length > 0) {
        const sum = dataPoints.reduce((acc, curr) => acc + curr.value, 0);
        if (sum > 0) {
          dataPoints.forEach(p => {
            p.value = Math.round((p.value / sum) * baseValue);
          });
        } else {
          dataPoints[3].value = Math.floor(baseValue * 0.3);
          dataPoints[4].value = Math.floor(baseValue * 0.4);
          dataPoints[5].value = Math.floor(baseValue * 0.3);
        }
      }
      return dataPoints;
    }

    return zeroDatasets[range];
  };

  const data = getDynamicChartData();
  const theme = themeConfigs[tab] || themeConfigs.overview;

  const chartConfig = {
    value: {
      label: theme.label,
      color: theme.color,
    },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181b] border border-white/[0.08] p-3 rounded-lg shadow-2xl text-xs">
          <p className="text-gray-400 mb-1">{label}</p>
          <div className="flex items-center gap-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: theme.color }}
            />
            <span className="text-white font-medium">
              {payload[0].value.toLocaleString()} {theme.label}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none bg-transparent p-0 w-full">
      <CardContent className="p-0">
        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: -20,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id={theme.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={theme.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                style={{ fontSize: "10px", fill: "#71717a" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                style={{ fontSize: "10px", fill: "#71717a" }}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={theme.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${theme.gradientId})`}
                activeDot={{
                  r: 6,
                  style: { fill: theme.color, strokeWidth: 0, filter: "drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.5))" }
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default Chart;

