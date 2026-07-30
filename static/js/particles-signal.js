/* ============================================================================
   SIGNAL — particle network
   ----------------------------------------------------------------------------
   Same white-matter idea as before: nodes, and links between nodes. What is
   added is the thing white matter actually does — conveying impulses. Packets
   travel the links, and the node they land on pings. Read as neurons or read
   as traffic on a monitored network; it is deliberately both.

   Replaces static/js/particles.js, which also carried a stats.js FPS counter
   copied from the original CodePen. stats.js was never loaded on this site, so
   every page threw "Uncaught ReferenceError: Stats is not defined". Gone.
   ========================================================================== */

(function () {
    "use strict";

    var SIGNAL = "#35e0d0";
    var SIGNAL_2 = "#67a2c9";
    var CRIT = "#ff5c78";

    var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    particlesJS("particles-js", {
        particles: {
            number: { value: 46, density: { enable: true, value_area: 900 } },
            color: { value: [SIGNAL, SIGNAL_2, "#ffffff"] },
            shape: {
                type: "circle",
                stroke: { width: 0, color: "#000000" },
                polygon: { nb_sides: 5 }
            },
            opacity: {
                value: 0.8,
                random: true,
                anim: {
                    enable: !reduceMotion,
                    speed: 0.5,
                    opacity_min: 0.3,
                    sync: false
                }
            },
            size: {
                value: 2.6,
                random: true,
                anim: {
                    enable: !reduceMotion,
                    speed: 0.7,
                    size_min: 0.3,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: 155,
                color: SIGNAL,
                opacity: 0.4,
                width: 1.2
            },
            move: {
                enable: !reduceMotion,
                speed: 0.7,
                direction: "none",
                random: false,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: { enable: true, rotateX: 900, rotateY: 1400 }
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: !reduceMotion, mode: "grab" },
                onclick: { enable: !reduceMotion, mode: "push" },
                resize: true
            },
            modes: {
                grab: { distance: 210, line_linked: { opacity: 0.6 } },
                push: { particles_nb: 3 },
                repulse: { distance: 200, duration: 0.4 },
                remove: { particles_nb: 2 }
            }
        },
        retina_detect: true
    });

    if (reduceMotion) return;

    /* --- packet layer ------------------------------------------------------
       A second canvas over the particle canvas, sharing its coordinate space
       so packet positions can be read straight off the live particle array
       (nodes keep drifting while a packet is in flight, and the packet should
       track them). */

    function start(attempt) {
        var dom = window.pJSDom && window.pJSDom[0];
        if (!dom || !dom.pJS || !dom.pJS.particles.array.length) {
            if (attempt > 40) return;
            return window.setTimeout(function () { start(attempt + 1); }, 120);
        }

        var pJS = dom.pJS;
        var host = document.getElementById("particles-js");
        var source = pJS.canvas.el;
        if (!host || !source) return;

        var canvas = document.createElement("canvas");
        canvas.className = "wm-packets";
        canvas.setAttribute("aria-hidden", "true");
        host.appendChild(canvas);
        var ctx = canvas.getContext("2d");

        function sync() {
            canvas.width = source.width;
            canvas.height = source.height;
        }
        sync();

        var resizeTimer;
        window.addEventListener("resize", function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(sync, 250);
        });

        var ratio = pJS.canvas.pxratio || 1;
        var packets = [];
        var pings = [];
        var MAX_PACKETS = 6;
        var SPAWN_MS = 620;
        var sinceSpawn = 0;
        var lastFrame = 0;

        function linkRange() {
            /* particles.js pre-scales line_linked.distance by the pixel ratio
               during retina init, so this is already in canvas units. */
            return pJS.particles.line_linked.distance;
        }

        function spawn() {
            var nodes = pJS.particles.array;
            if (nodes.length < 2 || packets.length >= MAX_PACKETS) return;

            var from = nodes[(Math.random() * nodes.length) | 0];
            var range = linkRange();
            var reachable = [];

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node === from) continue;
                var dx = from.x - node.x;
                var dy = from.y - node.y;
                if (dx * dx + dy * dy < range * range) reachable.push(node);
            }
            if (!reachable.length) return;

            var critical = Math.random() < 0.11;
            packets.push({
                from: from,
                to: reachable[(Math.random() * reachable.length) | 0],
                progress: 0,
                duration: 780 + Math.random() * 640,
                critical: critical,
                color: critical ? CRIT
                     : (Math.random() < 0.35 ? SIGNAL_2 : SIGNAL)
            });
        }

        function drawPacket(p) {
            /* fade in and out so packets never pop at either endpoint */
            var life = Math.sin(Math.PI * p.progress);
            var hx = p.from.x + (p.to.x - p.from.x) * p.progress;
            var hy = p.from.y + (p.to.y - p.from.y) * p.progress;
            var tailAt = Math.max(0, p.progress - 0.22);
            var tx = p.from.x + (p.to.x - p.from.x) * tailAt;
            var ty = p.from.y + (p.to.y - p.from.y) * tailAt;

            /* the link itself, lit for as long as it carries something */
            ctx.globalAlpha = 0.16 * life;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1 * ratio;
            ctx.beginPath();
            ctx.moveTo(p.from.x, p.from.y);
            ctx.lineTo(p.to.x, p.to.y);
            ctx.stroke();

            /* trail */
            var trail = ctx.createLinearGradient(tx, ty, hx, hy);
            trail.addColorStop(0, "transparent");
            trail.addColorStop(1, p.color);
            ctx.globalAlpha = 0.75 * life;
            ctx.strokeStyle = trail;
            ctx.lineWidth = 1.5 * ratio;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.stroke();

            /* head */
            ctx.globalAlpha = life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10 * ratio;
            ctx.beginPath();
            ctx.arc(hx, hy, 1.7 * ratio, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        function drawPing(ping) {
            var t = ping.progress;
            ctx.globalAlpha = (1 - t) * 0.55;
            ctx.strokeStyle = ping.color;
            ctx.lineWidth = 1 * ratio;
            ctx.beginPath();
            ctx.arc(ping.x, ping.y, (2 + t * 14) * ratio, 0, Math.PI * 2);
            ctx.stroke();
        }

        function frame(now) {
            var dt = lastFrame ? Math.min(now - lastFrame, 64) : 16;
            lastFrame = now;

            sinceSpawn += dt;
            if (sinceSpawn >= SPAWN_MS) {
                sinceSpawn = 0;
                spawn();
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (var i = packets.length - 1; i >= 0; i--) {
                var p = packets[i];
                p.progress += dt / p.duration;
                if (p.progress >= 1) {
                    pings.push({
                        x: p.to.x,
                        y: p.to.y,
                        progress: 0,
                        duration: p.critical ? 1000 : 640,
                        color: p.color
                    });
                    packets.splice(i, 1);
                    continue;
                }
                drawPacket(p);
            }

            for (var j = pings.length - 1; j >= 0; j--) {
                var ping = pings[j];
                ping.progress += dt / ping.duration;
                if (ping.progress >= 1) {
                    pings.splice(j, 1);
                    continue;
                }
                drawPing(ping);
            }

            ctx.globalAlpha = 1;
            window.requestAnimationFrame(frame);
        }

        window.requestAnimationFrame(frame);
    }

    start(0);
})();
