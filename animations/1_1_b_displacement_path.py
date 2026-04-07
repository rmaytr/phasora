"""
Manim animation for Concept 1.1b — Displacement is path-independent.

Render preview:   manim -pql animations/1_1_b_displacement_path.py DisplacementVsPath
Render HD:        manim -pqh animations/1_1_b_displacement_path.py DisplacementVsPath

After rendering, copy the output MP4 to:
  public/animations/1_1_b_displacement_path.mp4

NOTE: This script uses only Text() (Pango renderer) — no LaTeX installation required.
"""

from manim import *
import numpy as np

# ─── Phasora palette ──────────────────────────────────────────────────────────
BG_WHITE = "#FFFFFF"
AXES_GREY = "#94a3b8"
GRID_LIGHT = "#e2e8f0"
DOT_BLUE = "#1d4ed8"
GHOST_GREY = "#64748b"
PATH_A_BLUE = "#3b82f6"
PATH_B_ORANGE = "#f97316"
DISP_GREEN = "#16a34a"
TEXT_NAVY = "#0f172a"


def make_grid_labels(axes, color=AXES_GREY, font_size=14):
    """Add axis number labels using Text (Pango) instead of MathTex."""
    labels = VGroup()
    for val in range(int(axes.x_range[0]), int(axes.x_range[1]) + 1):
        if val == 0:
            continue
        lbl = Text(str(val), font_size=font_size, color=color)
        lbl.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
        labels.add(lbl)
    for val in range(int(axes.y_range[0]), int(axes.y_range[1]) + 1):
        if val == 0:
            continue
        lbl = Text(str(val), font_size=font_size, color=color)
        lbl.next_to(axes.c2p(0, val), LEFT, buff=0.15)
        labels.add(lbl)
    return labels


class DisplacementVsPath(Scene):
    def construct(self):
        self.camera.background_color = BG_WHITE

        start_coords = (-2, -1)
        end_coords = (3, 2)

        # ── Grid + Axes ─────────────────────────────────────────────────────
        axes = Axes(
            x_range=[-4, 5, 1],
            y_range=[-3, 4, 1],
            x_length=9,
            y_length=7,
            axis_config={
                "color": AXES_GREY,
                "stroke_width": 2,
                "include_ticks": True,
                "tick_size": 0.07,
                "include_numbers": False,
            },
            tips=False,
        )

        grid = NumberPlane(
            x_range=[-4, 5, 1],
            y_range=[-3, 4, 1],
            x_length=9,
            y_length=7,
            background_line_style={
                "stroke_color": GRID_LIGHT,
                "stroke_width": 0.8,
                "stroke_opacity": 0.6,
            },
            axis_config={"stroke_opacity": 0},
            faded_line_style={"stroke_opacity": 0},
        )
        grid.move_to(axes.get_center())

        axis_labels = make_grid_labels(axes)

        self.play(FadeIn(grid, run_time=0.5))
        self.play(Create(axes, run_time=0.8), FadeIn(axis_labels, run_time=0.8))
        self.wait(0.2)

        # ── Step 1 (0-3s): Place start point ────────────────────────────────
        start_pt = axes.c2p(*start_coords)
        end_pt = axes.c2p(*end_coords)

        start_dot = Dot(start_pt, radius=0.08, color=GHOST_GREY, z_index=4)
        start_label = Text(
            "Start (-2, -1)", font_size=14, color=GHOST_GREY,
        ).next_to(start_dot, DOWN + LEFT, buff=0.12)

        moving_dot = Dot(start_pt, radius=0.12, color=DOT_BLUE, z_index=6)

        self.play(
            FadeIn(start_dot),
            FadeIn(start_label),
            FadeIn(moving_dot, scale=1.3),
            run_time=0.8,
        )
        self.wait(0.5)

        # ── Step 2 (3-10s): Path A — direct route ──────────────────────────
        path_a_line = Line(start_pt, end_pt, color=PATH_A_BLUE, stroke_width=2.5)

        # Trace as dot moves
        trace_a = TracedPath(
            moving_dot.get_center,
            stroke_color=PATH_A_BLUE,
            stroke_width=2.5,
        )
        self.add(trace_a)

        self.play(
            moving_dot.animate(rate_func=smooth).move_to(end_pt),
            run_time=2.0,
        )
        self.remove(trace_a)
        self.add(path_a_line)

        end_label = Text(
            "End (3, 2)", font_size=14, color=TEXT_NAVY,
        ).next_to(moving_dot, UP + RIGHT, buff=0.12)
        self.play(FadeIn(end_label), run_time=0.4)

        # Green displacement arrow
        disp_arrow_a = Arrow(
            start_pt, end_pt,
            buff=0, color=DISP_GREEN,
            stroke_width=4,
            max_tip_length_to_length_ratio=0.1,
        )
        disp_mag = np.sqrt(
            (end_coords[0] - start_coords[0]) ** 2
            + (end_coords[1] - start_coords[1]) ** 2
        )
        disp_label_a = Text(
            f"Displacement = {disp_mag:.1f} units",
            font_size=14, color=DISP_GREEN,
        ).next_to(disp_arrow_a.get_center(), DOWN + RIGHT, buff=0.15)

        self.play(GrowArrow(disp_arrow_a), FadeIn(disp_label_a), run_time=0.8)
        self.wait(1.0)

        # ── Step 3 (10-11s): Reset dot to start ────────────────────────────
        self.play(
            FadeOut(disp_arrow_a),
            FadeOut(disp_label_a),
            FadeOut(end_label),
            run_time=0.3,
        )

        # Fade path A to low opacity
        self.play(
            path_a_line.animate.set_opacity(0.2),
            moving_dot.animate.move_to(start_pt),
            run_time=0.5,
        )

        # ── Step 4 (11-20s): Path B — curved route ─────────────────────────
        # Curved path through waypoints: start -> up -> right -> curve down -> end
        wp1 = axes.c2p(-2, 2)
        wp2 = axes.c2p(1, 3)
        wp3 = axes.c2p(4, 1)

        path_b_points = CubicBezier(
            start_pt,
            wp1,
            wp2,
            end_pt,
        )

        # Draw the curved path
        trace_b = TracedPath(
            moving_dot.get_center,
            stroke_color=PATH_B_ORANGE,
            stroke_width=2.5,
        )
        self.add(trace_b)

        self.play(
            MoveAlongPath(moving_dot, path_b_points, rate_func=smooth),
            run_time=3.0,
        )
        # Keep the traced path visible
        path_b_line = trace_b.copy().set_stroke(color=PATH_B_ORANGE, width=2.5)
        self.remove(trace_b)
        self.add(path_b_line)

        end_label_2 = Text(
            "End (3, 2)", font_size=14, color=TEXT_NAVY,
        ).next_to(moving_dot, UP + RIGHT, buff=0.12)
        self.play(FadeIn(end_label_2), run_time=0.4)

        # Same green displacement arrow
        disp_arrow_b = Arrow(
            start_pt, end_pt,
            buff=0, color=DISP_GREEN,
            stroke_width=4,
            max_tip_length_to_length_ratio=0.1,
        )
        disp_label_b = Text(
            f"Same displacement = {disp_mag:.1f} units",
            font_size=14, color=DISP_GREEN,
        ).next_to(disp_arrow_b.get_center(), DOWN + RIGHT, buff=0.15)

        self.play(GrowArrow(disp_arrow_b), FadeIn(disp_label_b), run_time=0.8)
        self.wait(1.0)

        # ── Step 5 (20-25s): The reveal ─────────────────────────────────────
        # Bring path A back to full opacity
        self.play(
            path_a_line.animate.set_opacity(1.0),
            run_time=0.5,
        )

        text_1 = Text(
            "Two completely different paths.",
            font_size=20, color=TEXT_NAVY,
        ).to_edge(DOWN, buff=0.8)

        text_2 = Text(
            "Identical displacement.",
            font_size=20, color=DISP_GREEN, weight=BOLD,
        ).next_to(text_1, DOWN, buff=0.15)

        self.play(FadeIn(text_1), run_time=0.5)
        self.play(FadeIn(text_2), run_time=0.5)
        self.wait(1.0)

        # Fade paths, keep only displacement arrow
        self.play(
            FadeOut(path_a_line),
            FadeOut(path_b_line),
            FadeOut(text_1),
            FadeOut(text_2),
            FadeOut(end_label_2),
            FadeOut(disp_label_b),
            FadeOut(moving_dot),
            run_time=0.8,
        )

        text_3 = Text(
            "Displacement only cares about\nstart and end.",
            font_size=22, color=TEXT_NAVY,
            line_spacing=1.4,
        ).to_edge(DOWN, buff=0.5)

        self.play(
            disp_arrow_b.animate.set_stroke(width=6),
            FadeIn(text_3),
            run_time=0.6,
        )
        self.wait(1.5)

        # ── Step 6 (25-27s): Show formula ───────────────────────────────────
        formula = Text(
            "dr = r_final - r_initial",
            font_size=20, color=TEXT_NAVY,
        )
        formula.next_to(text_3, DOWN, buff=0.3)

        self.play(FadeIn(formula), run_time=0.6)
        self.wait(2.0)

        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=0.8,
        )
