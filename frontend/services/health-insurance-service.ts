import api from "@/lib/api";
import { HealthInsurance } from "@/types";

type HealthInsuranceCollectionResponse = {
  data: HealthInsurance[];
};

type HealthInsuranceResourceResponse = {
  data: HealthInsurance;
};

type HealthInsurancePayload = Partial<
  Pick<HealthInsurance, "name" | "coverage_percentage" | "is_active">
> & {
  description?: string;
};

type HealthInsuranceCreatePayload = Required<Pick<HealthInsurancePayload, "name">> &
  Omit<HealthInsurancePayload, "name">;

function serializePayload(payload: HealthInsurancePayload) {
  return {
    ...payload,
    coverage_percentage:
      payload.coverage_percentage === undefined || payload.coverage_percentage === null
        ? null
        : Number(payload.coverage_percentage),
  };
};

const BASE_PATH = "/health-insurances";

export async function fetchHealthInsurances() {
  const { data } = await api.get<HealthInsuranceCollectionResponse>(BASE_PATH);
  return data.data;
}

export async function createHealthInsurance(payload: HealthInsuranceCreatePayload) {
  const { data } = await api.post<HealthInsuranceResourceResponse>(BASE_PATH, serializePayload(payload));
  return data.data;
}

export async function updateHealthInsurance(id: number, payload: HealthInsurancePayload) {
  const { data } = await api.put<HealthInsuranceResourceResponse>(
    `${BASE_PATH}/${id}`,
    serializePayload(payload)
  );
  return data.data;
}

export async function deleteHealthInsurance(id: number) {
  await api.delete(`${BASE_PATH}/${id}`);
}

export async function fetchHealthInsuranceStatistics() {
  const { data } = await api.get<{
    total_beneficiaries: number;
    total_active_insurances: number;
    average_beneficiaries_per_insurance: number;
  }>('/admin/health-insurances/statistics');
  return data;
}


