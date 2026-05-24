import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api";

const TYPES = ["", "sedan", "suv", "van", "motorcycle", "truck"];

function VehicleCard({ vehicle, start, end }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="bg-gray-100 rounded-xl h-40 flex items-center justify-center mb-3 text-5xl overflow-hidden">
        {vehicle.image_path ? (
          <img
            src={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/storage/${vehicle.image_path}`}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.innerHTML =
                vehicle.type === "suv"
                  ? "🚙"
                  : vehicle.type === "van"
                    ? "🚐"
                    : vehicle.type === "motorcycle"
                      ? "🏍"
                      : "🚗";
            }}
          />
        ) : vehicle.type === "suv" ? (
          "🚙"
        ) : vehicle.type === "van" ? (
          "🚐"
        ) : vehicle.type === "motorcycle" ? (
          "🏍"
        ) : (
          "🚗"
        )}
      </div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-medium text-gray-900">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-xs text-gray-500">
            {vehicle.year} • {vehicle.color} • {vehicle.type.toUpperCase()}
          </p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          Available
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">{vehicle.plate_number}</p>
      {vehicle.features?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {vehicle.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
            >
              {f}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-semibold text-gray-900">
            ₱{Number(vehicle.daily_rate).toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">/day</span>
        </div>
        <Link
          to={
            "/bookings/new?vehicle=" +
            vehicle.id +
            "&start=" +
            (start || "") +
            "&end=" +
            (end || "")
          }
          className="btn-primary text-xs px-3 py-1.5"
        >
          Book now
        </Link>
      </div>
    </div>
  );
}

export default function VehicleSearch() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const fmt = (d) => d.toISOString().slice(0, 16);

  const [filters, setFilters] = useState({
    start: fmt(now),
    end: fmt(tomorrow),
    type: "",
  });
  const [search, setSearch] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicles", search],
    queryFn: () =>
      api.get("/vehicles/available", { params: search }).then((r) => r.data),
    enabled: !!search,
  });

  const { data: allVehicles } = useQuery({
    queryKey: ["vehicles-all"],
    queryFn: () => api.get("/vehicles").then((r) => r.data),
    enabled: !search,
  });

  const vehicles = search ? data?.data : allVehicles?.data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Find a vehicle</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pickup and drop-off in Roxas City, Capiz
        </p>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Pickup date & time</label>
            <input
              type="datetime-local"
              className="input"
              value={filters.start}
              onChange={(e) =>
                setFilters({ ...filters, start: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Return date & time</label>
            <input
              type="datetime-local"
              className="input"
              value={filters.end}
              onChange={(e) => setFilters({ ...filters, end: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Vehicle type</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t ? t.charAt(0).toUpperCase() + t.slice(1) : "All types"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setSearch(filters)}
              className="btn-primary w-full"
            >
              Search available
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <p className="text-gray-400 text-sm text-center py-10">
          Searching available vehicles...
        </p>
      )}
      {isError && (
        <p className="text-red-500 text-sm text-center py-10">
          Something went wrong. Please try again.
        </p>
      )}

      {vehicles?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🚗</div>
          <p>No vehicles available for the selected dates.</p>
          <p className="text-sm mt-1">Try different dates or vehicle type.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles?.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            start={filters.start}
            end={filters.end}
          />
        ))}
      </div>
    </div>
  );
}
