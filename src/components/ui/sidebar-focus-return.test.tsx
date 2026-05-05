import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

/**
 * 사이드바 열림/닫힘 시 포커스 복귀 시나리오.
 *
 * 보장 사항:
 * 1) 데스크톱(collapsible="icon"): 트리거로 열고 → 사이드바 내부 포커스 →
 *    트리거로 다시 닫으면 포커스가 트리거 버튼으로 자동 복귀.
 * 2) aria-expanded가 상태에 따라 토글되어 SR이 변화를 즉시 인지.
 * 3) 모바일(Sheet): 동일한 복귀 로직이 동작.
 * 4) 키보드(Enter/Space)와 클릭 모두에서 동일하게 동작.
 *
 * 트리거의 포커스 복귀는 requestAnimationFrame 안에서 실행되므로 테스트는
 * rAF를 명시적으로 flush 해야 한다.
 */

const Harness = () => (
  <SidebarProvider defaultOpen={false}>
    <SidebarTrigger data-testid="trigger" />
    <Sidebar id="app-sidebar" aria-label="주요 내비게이션" collapsible="icon">
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="first-item">홈</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="second-item">
              아카이브
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  </SidebarProvider>
);

const flushRaf = async () => {
  // SidebarTrigger가 닫힘 직후 requestAnimationFrame 안에서 포커스를 되돌림.
  await act(async () => {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  });
};

const setMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

describe("Sidebar focus return", () => {
  beforeEach(() => {
    // 데스크톱 기본
    setMatchMedia(false);
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
    // 일부 환경에서 rAF가 비동기 큐로만 동작하지 않도록 보장
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (cb: FrameRequestCallback) => {
        return setTimeout(() => cb(performance.now()), 0) as unknown as number;
      },
    );
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) =>
      clearTimeout(id as unknown as NodeJS.Timeout),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("aria-expanded가 토글 상태를 반영한다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByTestId("trigger");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", "app-sidebar");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    await flushRaf();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("닫힐 때 사이드바 내부에 있던 포커스가 트리거로 복귀한다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByTestId("trigger");

    // 1) 트리거로 사이드바 열기
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // 2) 사이드바 내부 메뉴로 포커스 이동(키보드 Tab을 흉내내서 명시 focus)
    const firstItem = screen.getByTestId("first-item");
    firstItem.focus();
    expect(document.activeElement).toBe(firstItem);

    // 3) 트리거를 다시 클릭해 닫기 (포커스는 사이드바 내부에 있는 상태)
    await user.click(trigger);
    await flushRaf();

    // 4) 포커스가 트리거 버튼으로 복귀해야 함
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger);
  });

  it("키보드(Enter)로 닫아도 트리거로 포커스가 복귀한다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByTestId("trigger");

    // Tab으로 트리거에 포커스 → Enter로 열기
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // 사이드바 내부로 포커스 이동
    const firstItem = screen.getByTestId("first-item");
    firstItem.focus();
    expect(document.activeElement).toBe(firstItem);

    // 다시 트리거에 포커스 후 Space로 닫기 (대체로 키보드 사용자가 토글로 돌아오는 흐름)
    trigger.focus();
    await user.keyboard(" ");
    await flushRaf();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger);
  });

  it("사용자가 사이드바 밖의 다른 곳에 포커스를 둔 경우엔 빼앗지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <button data-testid="outside">바깥 버튼</button>
      </>,
    );
    const trigger = screen.getByTestId("trigger");
    const outside = screen.getByTestId("outside");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // 사용자가 명시적으로 바깥 요소에 포커스를 줌
    outside.focus();
    expect(document.activeElement).toBe(outside);

    // 트리거 클릭은 포커스를 트리거로 옮기므로 시나리오에 맞지 않음.
    // 단축키(Ctrl+B)로 닫아 포커스 이동 없이 토글되는 경로를 검증.
    await user.keyboard("{Control>}b{/Control}");
    await flushRaf();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // 사이드바 외부에 포커스가 있었으므로 그대로 유지되어야 함
    expect(document.activeElement).toBe(outside);
  });

  it("모바일(Sheet)에서도 닫힘 시 포커스가 트리거로 복귀한다", async () => {
    // 모바일 모드 활성화
    setMatchMedia(true);
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });

    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByTestId("trigger");

    // 모바일에서도 aria 속성은 동일하게 노출
    expect(trigger).toHaveAttribute("aria-controls", "app-sidebar");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // 모바일 Sheet 안의 메뉴로 포커스 이동 (Sheet은 portal에 렌더됨)
    const firstItem = await screen.findByTestId("first-item");
    firstItem.focus();
    expect(document.activeElement).toBe(firstItem);

    // Sheet은 body에 pointer-events:none을 걸기 때문에 click 대신
    // 글로벌 단축키(Ctrl+B)로 닫는 경로를 검증.
    await user.keyboard("{Control>}b{/Control}");
    await flushRaf();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Sheet이 닫힐 때 포커스가 사이드바 내부에 남아 있었으므로 트리거로 복귀
    expect(document.activeElement).toBe(trigger);
  });
});
