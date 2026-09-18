"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";

const projects = [
  {
    number: "01",
    title: "Rome ’26",
    eyebrow: "Reisapp · binnenkort",
    href: "/rome-2026",
    description:
      "Planning, plekken, foto’s, Italiaanse zinnen en een klein beetje competitie voor vijf reizigers.",
    mutedColor: "bg-[#b31c38]",
    mainColor: "bg-[#ce0f3d]",
    textColor: "text-white",
    labelColor: "text-[#ffd2dd]",
    accentColor: "#fa9ab0",
  },
  {
    number: "02",
    title: "Data",
    eyebrow: "Visualisaties · in opbouw",
    description:
      "Dashboards, Python-experimenten en manieren om cijfers net iets minder saai te maken.",
    mutedColor: "bg-[#2994c9]",
    mainColor: "bg-[#54a7d9]",
    textColor: "text-white",
    labelColor: "text-[#e7f6fc]",
    accentColor: "#bbdff3",
  },
  {
    number: "03",
    title: "Games",
    eyebrow: "Treasure Hunt · live",
    href: "/games/treasure-hunt",
    description:
      "Een retro avontuur met puzzels, muziek, een schat en een verhaal dat ik ooit zelf in Python bouwde.",
    mutedColor: "bg-[#fbb01f]",
    mainColor: "bg-[#fdc32d]",
    textColor: "text-[#023a4f]",
    labelColor: "text-[#023a4f]",
    accentColor: "#fedeaf",
  },
  {
    number: "04",
    title: "Playground",
    eyebrow: "Experimenten · altijd open",
    description:
      "Een verzamelplek voor ideeën die nog geen categorie, plan of einddatum nodig hebben.",
    mutedColor: "bg-[#0d5748]",
    mainColor: "bg-[#006853]",
    textColor: "text-white",
    labelColor: "text-[#d7f2dd]",
    accentColor: "#bbdfb2",
  },
];

export function ProjectsCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const isDragging = useRef(false);
  const [activeProject, setActiveProject] = useState(0);
  const [projectInDevelopment, setProjectInDevelopment] = useState<(typeof projects)[number] | null>(null);

  function scrollProjects(direction: "previous" | "next") {
    const carousel = carouselRef.current;
    const firstCard = carousel?.querySelector<HTMLElement>("article");

    if (!carousel || !firstCard) return;

    carousel.scrollBy({
      left: (firstCard.offsetWidth + 16) * (direction === "next" ? 1 : -1),
      behavior: "smooth",
    });
  }

  function updateActiveProject() {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const cardWidth = carousel.querySelector<HTMLElement>("article")?.offsetWidth;
    if (!cardWidth) return;

    setActiveProject(Math.round(carousel.scrollLeft / (cardWidth + 16)));
  }

  function startDragging(event: PointerEvent<HTMLDivElement>) {
    const carousel = carouselRef.current;
    if (!carousel) return;

    if ((event.target as HTMLElement).closest("a, button")) return;

    isDragging.current = true;
    dragStartX.current = event.clientX;
    dragStartScrollLeft.current = carousel.scrollLeft;
    carousel.setPointerCapture(event.pointerId);
  }

  function dragProjects(event: PointerEvent<HTMLDivElement>) {
    const carousel = carouselRef.current;
    if (!carousel || !isDragging.current) return;

    const distance = event.clientX - dragStartX.current;

    carousel.scrollLeft = dragStartScrollLeft.current - distance;
  }

  function stopDragging() {
    isDragging.current = false;
  }

  function renderProjectCard(project: (typeof projects)[number]) {
    const card = (
      <article
        className={`relative aspect-[0.86] w-full overflow-hidden rounded-[2.5rem] p-5 shadow-sm transition duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-[-1deg] sm:aspect-square sm:p-8 ${project.mainColor} ${project.textColor}`}
      >
        <div
          className={`absolute -bottom-[87%] -left-[87%] h-[174%] w-[174%] rounded-full transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-3 ${project.mutedColor}`}
        />
        <div
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full border-[18px] transition-transform duration-700 ease-out group-hover:scale-125 group-hover:-translate-x-4 group-hover:translate-y-4"
          style={{ borderColor: project.accentColor }}
        />
        <div
          className="absolute bottom-8 right-8 h-4 w-4 rounded-full transition-transform duration-500 group-hover:scale-150"
          style={{ backgroundColor: project.accentColor }}
        />
        <div className="relative flex h-full flex-col">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">
            <span>Project {project.number}</span>
          </div>
          <div className="mt-auto max-w-sm">
            <p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${project.labelColor}`}>
              {project.eyebrow}
            </p>
            <h2 className="mt-2 text-4xl font-semibold leading-none tracking-[-0.075em] sm:text-6xl">
              {project.title}
            </h2>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed opacity-70 sm:mt-5 sm:text-base">
              {project.description}
            </p>
          </div>
        </div>
      </article>
    );

    const wrapperClass = "group relative w-[84vw] shrink-0 snap-center sm:w-[520px]";

    if (!project.href) {
      return (
        <div className={wrapperClass} key={project.number}>
          {card}
          <button
            aria-label={`Bekijk de status van ${project.title}`}
            className="absolute inset-0 z-10 rounded-[2.5rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#023a4f]"
            onClick={() => setProjectInDevelopment(project)}
            type="button"
          />
        </div>
      );
    }

    return (
      <div className={wrapperClass} key={project.number}>
        {card}
        <Link
          aria-label={`Open ${project.title}`}
          className="absolute inset-0 z-10 rounded-[2.5rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#023a4f]"
          href={project.href}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        aria-label="Projecten"
        className="project-strip -mx-6 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 active:cursor-grabbing sm:-mx-10 sm:px-10 lg:-mx-16 lg:px-16"
        onPointerCancel={stopDragging}
        onPointerDown={startDragging}
        onPointerMove={dragProjects}
        onPointerUp={stopDragging}
        onScroll={updateActiveProject}
        ref={carouselRef}
        role="region"
      >
        {projects.map(renderProjectCard)}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2" aria-label="Actief project">
          {projects.map((project, index) => (
            <span
              aria-label={`Project ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeProject ? "w-7 bg-[#023a4f]" : "w-1.5 bg-[#023a4f]/20"
              }`}
              key={project.number}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Vorig project"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#023a4f]/15 transition-colors hover:bg-[#023a4f] hover:text-white"
            onClick={() => scrollProjects("previous")}
            type="button"
          >
            ←
          </button>
          <button
            aria-label="Volgend project"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#023a4f]/15 transition-colors hover:bg-[#023a4f] hover:text-white"
            onClick={() => scrollProjects("next")}
            type="button"
          >
            →
          </button>
        </div>
      </div>

      {projectInDevelopment ? (
        <div aria-labelledby="development-title" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center p-5" role="dialog">
          <button
            aria-label="Sluit melding"
            className="absolute inset-0 bg-[#023a4f]/55 backdrop-blur-sm"
            onClick={() => setProjectInDevelopment(null)}
            type="button"
          />
          <div className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] p-7 text-white shadow-[14px_16px_0_#023a4f] animate-[project-pop_500ms_cubic-bezier(0.16,1,0.3,1)] sm:p-9 ${projectInDevelopment.mainColor}`}>
            <div className={`absolute -right-16 -top-16 h-52 w-52 rounded-full border-[24px] ${projectInDevelopment.mutedColor}`} />
            <div className="absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-white/15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${projectInDevelopment.labelColor}`}>
                  Project {projectInDevelopment.number} · in de werkplaats
                </p>
                <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-lg animate-[gentle-spin_8s_linear_infinite]">✦</span>
              </div>
              <h2 className="mt-10 text-5xl font-semibold leading-[0.9] tracking-[-0.08em]" id="development-title">
                {projectInDevelopment.title} is nog aan het groeien.
              </h2>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-white/80">
                Ik ben hier achter de schermen mee bezig. Dit hoekje krijgt binnenkort zijn eerste echte vorm.
              </p>
              <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/75">
                Status: nieuwsgierigheid wordt gebouwd
              </div>
              <button
                className="mt-8 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#023a4f] shadow-[4px_5px_0_rgba(2,58,79,0.35)] transition-transform hover:-translate-y-0.5"
                onClick={() => setProjectInDevelopment(null)}
                type="button"
              >
                Terug naar de playground →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
