import { UIManager } from "../components/UIManager.js";

describe("UIManager", () => {
  let uiManager;

  beforeEach(() => {
    uiManager = new UIManager();
  });

  describe("formatMass", () => {
    test("should format zero mass correctly", () => {
      expect(uiManager.formatMass(0)).toBe("0 kg");
    });

    test("should format small masses in grams", () => {
      expect(uiManager.formatMass(500)).toBe("500.00 g");
    });

    test("should format masses in kilograms", () => {
      expect(uiManager.formatMass(1500)).toBe("1.50 kg");
    });

    test("should format large masses with appropriate units", () => {
      expect(uiManager.formatMass(1e12)).toBe("1.00 Tg");
      expect(uiManager.formatMass(1e18)).toBe("1.00 Eg");
      expect(uiManager.formatMass(1e21)).toBe("1.00 Zg");
    });
  });

  describe("formatDistance", () => {
    test("should format zero distance correctly", () => {
      expect(uiManager.formatDistance(0)).toBe("0 km");
    });

    test("should format small distances in km", () => {
      expect(uiManager.formatDistance(500)).toBe("500.00 km");
    });

    test("should format large distances with appropriate units", () => {
      expect(uiManager.formatDistance(1e6)).toBe("1.00 million km");
      expect(uiManager.formatDistance(1e9)).toBe("1.00 billion km");
    });
  });

  describe("formatTime", () => {
    test("should format zero time correctly", () => {
      expect(uiManager.formatTime(0)).toBe("0 days");
    });

    test("should format time in days", () => {
      const secondsInDay = 24 * 60 * 60;
      expect(uiManager.formatTime(secondsInDay * 30)).toBe("30.0 days");
    });

    test("should format time in years", () => {
      const secondsInYear = 365.25 * 24 * 60 * 60;
      expect(uiManager.formatTime(secondsInYear * 2)).toBe("2.00 years");
    });
  });

  describe("updateStats", () => {
    test("should update stats correctly", () => {
      const stats = {
        asteroidCount: 1000,
        totalMass: 1e12,
        fps: 60,
      };

      // Mock DOM elements
      uiManager.asteroidCountElement = { textContent: "" };
      uiManager.totalMassElement = { textContent: "" };
      uiManager.fpsElement = { textContent: "" };

      uiManager.updateStats(stats);

      expect(uiManager.asteroidCountElement.textContent).toBe("1,000");
      expect(uiManager.totalMassElement.textContent).toBe("1.00 Tg");
      expect(uiManager.fpsElement.textContent).toBe(60);
    });
  });
});
