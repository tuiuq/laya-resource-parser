import { Logger, LogLevel } from "./laya/Logger";

const logger = new Logger("TestManger", LogLevel.DEBUG)

logger.warn("Hello")
logger.error("Hello")
logger.debug("Hello")
logger.info("Hello")
