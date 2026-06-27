import { format as sqlFormat } from "sql-formatter";

export type Dialect =
  | "sql"
  | "mysql"
  | "postgresql"
  | "sqlite"
  | "transactsql"
  | "bigquery"
  | "mariadb";

export const DIALECTS: { value: Dialect; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "sqlite", label: "SQLite" },
  { value: "transactsql", label: "T-SQL" },
  { value: "bigquery", label: "BigQuery" },
];

export type SqlResult = { ok: true; value: string } | { ok: false; error: string };

export function formatSql(input: string, dialect: Dialect): SqlResult {
  if (input.trim() === "") return { ok: true, value: "" };
  try {
    const formatted = sqlFormat(input, {
      language: dialect,
      tabWidth: 2,
      keywordCase: "upper",
      linesBetweenQueries: 1,
    });
    return { ok: true, value: formatted };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
