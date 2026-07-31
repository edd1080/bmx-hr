"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Question = { id: string; texto: string; opciones: string[] };

export function ExamPanel({
  courseId,
  questions,
  puntajeAprobacion,
}: {
  courseId: string;
  questions: Question[];
  puntajeAprobacion: number;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; aprobado: boolean; aciertos: number; total: number } | null>(null);

  async function submit() {
    if (Object.keys(answers).length < questions.length) {
      showToast("Responde todas las preguntas.", false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "No se pudo enviar el examen.", false);
      return;
    }
    const data = await res.json();
    setResult({ score: data.score, aprobado: data.aprobado, aciertos: data.aciertos, total: data.total });
    router.refresh();
  }

  if (result) {
    return (
      <div
        className={`rounded-[14px] border p-6 text-center ${
          result.aprobado ? "border-success bg-success-bg" : "border-danger bg-danger-bg"
        }`}
      >
        <div className="text-4xl">{result.aprobado ? "🎉" : "😕"}</div>
        <h3 className={`font-display mt-2 text-xl font-bold ${result.aprobado ? "text-success" : "text-danger"}`}>
          {result.aprobado ? "¡Aprobado!" : "No aprobado"}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Calificación: <b>{result.score}%</b> ({result.aciertos} de {result.total} correctas)
        </p>
        <p className="mt-0.5 text-xs text-text-muted-2">Mínimo para aprobar: {puntajeAprobacion}%</p>
        {!result.aprobado && (
          <button
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
            className="mt-4 rounded-[10px] bg-brand-accent px-5 py-2.5 text-sm font-bold text-white"
          >
            Volver a intentar
          </button>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <button
        onClick={() => setStarted(true)}
        className="rounded-[10px] bg-brand-accent px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(74,136,250,.28)]"
      >
        Presentar examen ({questions.length} preguntas · mín. {puntajeAprobacion}%)
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-[12px] border border-divider p-4">
          <p className="mb-3 text-sm font-bold text-brand-primary">
            {qi + 1}. {q.texto}
          </p>
          <div className="flex flex-col gap-2">
            {q.opciones.map((op, oi) => {
              const checked = answers[q.id] === oi;
              return (
                <label
                  key={oi}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-[9px] border-[1.5px] px-3 py-2 text-sm ${
                    checked ? "border-brand-accent bg-vacation-bg text-brand-primary" : "border-divider text-text-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={checked}
                    onChange={() => setAnswers((p) => ({ ...p, [q.id]: oi }))}
                    className="h-4 w-4 accent-[#4A88FA]"
                  />
                  {op}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-[10px] bg-brand-accent px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Calificando…" : "Enviar examen"}
        </button>
      </div>
    </div>
  );
}
