"use client";

import { useRouter } from "next/navigation";
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
    eyebrow: "Spelen · in opbouw",
    description:
      "Van oude Python-projecten tot kleine webgames waar je even in kunt verdwijnen.",
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
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const isDragging = useRef(false);
  const draggedSincePointerDown = useRef(false);
  const [activeProject, setActiveProject] = useState(0);

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

    isDragging.current = true;
    draggedSincePointerDown.current = false;
    dragStartX.current = event.clientX;
    dragStartScrollLeft.current = carousel.scrollLeft;
    carousel.setPointerCapture(event.pointerId);
  }

  function dragProjects(event: PointerEvent<HTMLDivElement>) {
    const carousel = carouselRef.current;
    if (!carousel || !isDragging.current) return;

    const distance = event.clientX - dragStartX.current;

    if (Math.abs(distance) > 8) {
      draggedSincePointerDown.current = true;
    }

    carousel.scrollLeft = dragStartScrollLeft.current - distance;
  }

  function stopDragging() {
    isDragging.current = false;
  }

  function openProject(href?: string) {
    if (!href || draggedSincePointerDown.current) {
      draggedSincePointerDown.current = false;
      return;
    }

    router.push(href);
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
        {projects.map((project) => (
          <article
            aria-label={project.href ? `Open ${project.title}` : undefined}
            className={`group relative aspect-square w-[84vw] shrink-0 snap-center overflow-hidden rounded-[2.5rem] p-6 shadow-sm transition duration-500 ease-out hover:-translate-y-2 hover:rotate-[-1deg] sm:w-[520px] sm:p-8 ${project.href ? "cursor-pointer" : ""} ${project.mainColor} ${project.textColor}`}
            onClick={() => openProject(project.href)}
            onKeyDown={(event) => {
              if (project.href && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                openProject(project.href);
              }
            }}
            role={project.href ? "link" : undefined}
            tabIndex={project.href ? 0 : undefined}
            key={project.number}
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
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">
                <span>Project {project.number}</span>
                {project.href ? (
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 place-items-center rounded-full transition-colors group-hover:bg-white/15"
                  >
                    ↗
                  </span>
                ) : (
                  <span>↗</span>
                )}
              </div>
              <div className="mt-auto max-w-sm">
                <p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${project.labelColor}`}>
                  {project.eyebrow}
                </p>
                <h2 className="mt-2 text-5xl font-semibold leading-none tracking-[-0.075em] sm:text-6xl">
                  {project.title}
                </h2>
                <p className="mt-5 max-w-xs text-sm leading-relaxed opacity-70 sm:text-base">
                  {project.description}
                </p>
              </div>
            </div>
          </article>
        ))}
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
    </div>
  );
}
