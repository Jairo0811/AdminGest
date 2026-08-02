import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileDown,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  buildCorporateReportHtml,
  CorporateReportColumn,
  CorporateReportMetric,
} from "../utils/corporate-report";
import { ExportColumn, exportToExcel } from "../utils/export";
import { Modal } from "./Modal";

export interface Entity extends Record<string, unknown> {
  id: string;
}

interface Column {
  label: string;
  render(item: Entity): ReactNode;
  exportValue?: (item: Entity) => string | number | null | undefined;
  exportFormat?: CorporateReportColumn<Entity>["format"];
  exportAlign?: CorporateReportColumn<Entity>["align"];
}

interface Option {
  value: string;
  label: string;
}

interface Field {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "number"
    | "date"
    | "datetime-local"
    | "textarea"
    | "select";
  required?: boolean;
  options?: Option[];
  optionsEndpoint?: string;
  optionLabel?: (item: Entity) => string;
  placeholder?: string;
  defaultValue?: string | number;
}

interface EntityPageProps {
  title: string;
  description: string;
  endpoint: string;
  singular: string;
  columns: Column[];
  fields: Field[];
  canEdit?: boolean;
  canDelete?: boolean;
  headerActions?: ReactNode;
  buildPayload?(values: Record<string, string | number>): unknown;
  itemActions?: (item: Entity) => ReactNode;
  reportMetrics?: (items: Entity[]) => CorporateReportMetric[];
}

const normalizeValue = (field: Field, value: string) =>
  field.type === "number" ? Number(value) : value || undefined;

const humanize = (value: string) =>
  value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");

const openPrintWindow = (html: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error(
      "El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes para AdminGest e inténtalo nuevamente.",
    );
  }

  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export function EntityPage({
  title,
  description,
  endpoint,
  singular,
  columns,
  fields,
  canEdit = true,
  canDelete = true,
  headerActions,
  buildPayload,
  itemActions,
  reportMetrics,
}: EntityPageProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<Entity | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Entity | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const queryKey = [endpoint];

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api<Entity[]>(endpoint),
  });

  const lookupEndpoints = useMemo(
    () => [
      ...new Set(fields.map((field) => field.optionsEndpoint).filter(Boolean)),
    ],
    [fields],
  ) as string[];

  const lookupQueries = useQueries({
    queries: lookupEndpoints.map((lookupEndpoint) => ({
      queryKey: [lookupEndpoint],
      queryFn: () => api<Entity[]>(lookupEndpoint),
    })),
  });
  const lookups = lookupEndpoints.map(
    (lookupEndpoint, index) =>
      [lookupEndpoint, lookupQueries[index].data ?? []] as const,
  );

  const save = useMutation({
    mutationFn: async (values: Record<string, string | number>) => {
      const payload = buildPayload ? buildPayload(values) : values;
      return api<Entity>(editing ? `${endpoint}/${editing.id}` : endpoint, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      setEditing(undefined);
      setError("");
      setNotice(
        `${singular[0].toUpperCase()}${singular.slice(1)} guardado correctamente.`,
      );
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      setPendingDelete(null);
      setNotice(`${singular[0].toUpperCase()}${singular.slice(1)} eliminado.`);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  useEffect(() => {
    setPage(1);
  }, [search, status, pageSize]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const statuses = useMemo(
    () =>
      [
        ...new Set(
          data.map((item) => String(item.status ?? "")).filter(Boolean),
        ),
      ].sort(),
    [data],
  );

  const filtered = useMemo(
    () =>
      data.filter((item) => {
        const matchesSearch = JSON.stringify(item)
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus =
          status === "ALL" || String(item.status) === status;
        return matchesSearch && matchesStatus;
      }),
    [data, search, status],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const exportColumns = useMemo<ExportColumn<Entity>[]>(
    () =>
      columns.map((column) => ({
        label: column.label,
        value: column.exportValue ?? (() => ""),
      })),
    [columns],
  );

  const reportColumns = useMemo<CorporateReportColumn<Entity>[]>(
    () =>
      columns
        .filter((column) => column.exportValue)
        .map((column) => ({
          label: column.label,
          value: column.exportValue!,
          format: column.exportFormat,
          align: column.exportAlign,
        })),
    [columns],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      fields.map((field) => [
        field.name,
        normalizeValue(field, String(formData.get(field.name) ?? "")),
      ]),
    ) as Record<string, string | number>;
    save.mutate(values);
  };

  const printCorporateReport = () => {
    const html = buildCorporateReportHtml({
      title,
      subtitle: description,
      companyName: user?.company.name ?? "AdminGest",
      generatedBy: user
        ? `${user.firstName} ${user.lastName}`.trim() || user.email
        : undefined,
      items: filtered,
      columns: reportColumns,
      metrics: reportMetrics?.(filtered) ?? [
        { label: "Registros", value: filtered.length, tone: "blue" },
      ],
    });
    openPrintWindow(html);
  };

  return (
    <section className="page">
      {notice && (
        <div className="toast toast--success" role="status">
          {notice}
        </div>
      )}

      <div className="page-heading">
        <div>
          <p className="eyebrow">Gestión empresarial</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="page-heading-actions">
          {headerActions}
          <button
            className="primary-button"
            onClick={() => setEditing(null)}
            type="button"
          >
            <Plus size={18} /> Nuevo {singular}
          </button>
        </div>
      </div>

      <div className="toolbar entity-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            aria-label={`Buscar ${title.toLowerCase()}`}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Buscar en ${title.toLowerCase()}...`}
            value={search}
          />
        </label>

        {statuses.length > 0 && (
          <label className="filter-select">
            <Filter size={16} />
            <select
              aria-label="Filtrar por estado"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="ALL">Todos los estados</option>
              {statuses.map((itemStatus) => (
                <option key={itemStatus} value={itemStatus}>
                  {humanize(itemStatus)}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="export-actions">
          <button
            className="secondary-button"
            disabled={!filtered.length}
            onClick={() => exportToExcel(title, filtered, exportColumns)}
            type="button"
          >
            <FileSpreadsheet size={17} /> Excel
          </button>
          <button
            className="secondary-button"
            disabled={!filtered.length || reportColumns.length === 0}
            onClick={printCorporateReport}
            type="button"
          >
            <FileDown size={17} /> PDF
          </button>
        </div>
        <span className="record-count">{filtered.length} registros</span>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-card">
        <div className="data-table table-header">
          {columns.map((column) => (
            <strong key={column.label}>{column.label}</strong>
          ))}
          {(canEdit || canDelete || itemActions) && <strong>Acciones</strong>}
        </div>
        {isLoading ? (
          <div className="table-skeleton" aria-label="Cargando información">
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="empty-state">
            <strong>No hay resultados</strong>
            <p>Ajusta los filtros o crea tu primer {singular}.</p>
          </div>
        ) : (
          visibleItems.map((item) => (
            <div className="data-table table-row" key={item.id}>
              {columns.map((column) => (
                <div data-label={column.label} key={column.label}>
                  {column.render(item)}
                </div>
              ))}
              {(canEdit || canDelete || itemActions) && (
                <div className="row-actions" data-label="Acciones">
                  {itemActions?.(item)}
                  {canEdit && (
                    <button
                      aria-label={`Editar ${singular}`}
                      className="table-action"
                      onClick={() => setEditing(item)}
                      type="button"
                    >
                      <Edit3 size={17} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      aria-label={`Eliminar ${singular}`}
                      className="table-action danger"
                      onClick={() => setPendingDelete(item)}
                      type="button"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {filtered.length > pageSize && (
        <div className="pagination">
          <label>
            Mostrar
            <select
              onChange={(event) => setPageSize(Number(event.target.value))}
              value={pageSize}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span>
            Página {page} de {totalPages}
          </span>
          <div>
            <button
              aria-label="Página anterior"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label="Página siguiente"
              disabled={page === totalPages}
              onClick={() => setPage((value) => value + 1)}
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {editing !== undefined && (
        <Modal
          onClose={() => {
            setEditing(undefined);
            setError("");
          }}
          title={editing ? `Editar ${singular}` : `Nuevo ${singular}`}
        >
          <form className="entity-form" onSubmit={submit}>
            {fields.map((field) => {
              const lookup =
                lookups.find(([key]) => key === field.optionsEndpoint)?.[1] ??
                [];
              const options =
                field.options ??
                lookup.map((item) => ({
                  value: item.id,
                  label:
                    field.optionLabel?.(item) ?? String(item.name ?? item.id),
                }));
              const defaultValue = String(
                editing?.[field.name] ?? field.defaultValue ?? "",
              );

              return (
                <label
                  className={
                    field.type === "textarea" ? "form-field full" : "form-field"
                  }
                  key={field.name}
                >
                  <span>{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      defaultValue={defaultValue}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <select
                      defaultValue={defaultValue}
                      name={field.name}
                      required={field.required}
                    >
                      <option value="">Selecciona una opción</option>
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      defaultValue={defaultValue}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      type={field.type ?? "text"}
                    />
                  )}
                </label>
              );
            })}
            {error && <div className="alert error form-alert">{error}</div>}
            <footer className="form-actions">
              <button
                className="secondary-button"
                onClick={() => setEditing(undefined)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                disabled={save.isPending}
                type="submit"
              >
                {save.isPending ? "Guardando…" : "Guardar"}
              </button>
            </footer>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        <Modal
          onClose={() => setPendingDelete(null)}
          title={`Eliminar ${singular}`}
        >
          <div className="confirm-dialog">
            <p>
              Esta acción no se puede deshacer. ¿Deseas eliminar el registro
              seleccionado?
            </p>
            <footer className="form-actions">
              <button
                className="secondary-button"
                onClick={() => setPendingDelete(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="danger-button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(pendingDelete.id)}
                type="button"
              >
                {remove.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </footer>
          </div>
        </Modal>
      )}
    </section>
  );
}
