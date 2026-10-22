#include "include/httplib.h"
#include "include/json.hpp"
#include "knapsack.hpp"
#include <iostream>
#include <cstdlib>
#include <string>

using json = nlohmann::json;

int main(int argc, char* argv[]) {
    int port = 8080;
    if (argc > 1) {
        try {
            port = std::stoi(argv[1]);
        } catch (...) {
            std::cerr << "Invalid port argument, defaulting to 8080\n";
        }
    } else if (const char* env_p = std::getenv("PORT")) {
        try {
            port = std::stoi(env_p);
        } catch (...) {
            // Keep default
        }
    }

    httplib::Server svr;

    // Global CORS pre-routing handler
    svr.set_pre_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");

        if (req.method == "OPTIONS") {
            res.status = 204;
            return httplib::Server::HandlerResponse::Handled;
        }
        return httplib::Server::HandlerResponse::Unhandled;
    });

    // Global exception guard to keep server running under any error condition
    svr.set_exception_handler([](const auto& /*req*/, auto& res, std::exception_ptr ep) {
        try {
            if (ep) {
                std::rethrow_exception(ep);
            }
        } catch (const std::exception& e) {
            json err = {{"error", e.what()}};
            res.status = 500;
            res.set_content(err.dump(), "application/json");
        } catch (...) {
            json err = {{"error", "Unknown server exception occurred."}};
            res.status = 500;
            res.set_content(err.dump(), "application/json");
        }
    });

    // Health check endpoint
    svr.Get("/api/health", [](const httplib::Request& /*req*/, httplib::Response& res) {
        std::cout << "[C++ Backend] GET /api/health received\n";
        json response = {
            {"status", "ok"},
            {"service", "SpendSmart C++ Backend"},
            {"algorithm", "0/1 Knapsack Dynamic Programming"},
            {"version", "1.0.0"}
        };
        res.set_content(response.dump(), "application/json");
    });

    // Knapsack optimization endpoint
    svr.Post("/api/optimize", [](const httplib::Request& req, httplib::Response& res) {
        std::cout << "[C++ Backend] POST /api/optimize received\n";
        try {
            if (req.body.empty()) {
                json err = {{"error", "Request payload body cannot be empty."}};
                res.status = 400;
                res.set_content(err.dump(), "application/json");
                return;
            }

            json body = json::parse(req.body);

            if (!body.contains("budget")) {
                json err = {{"error", "Missing required field: 'budget'."}};
                res.status = 400;
                res.set_content(err.dump(), "application/json");
                return;
            }

            if (!body["budget"].is_number_integer()) {
                json err = {{"error", "Field 'budget' must be an integer."}};
                res.status = 400;
                res.set_content(err.dump(), "application/json");
                return;
            }

            int budget = body["budget"].get<int>();

            std::vector<spendsmart::Item> items;
            if (body.contains("items")) {
                if (!body["items"].is_array()) {
                    json err = {{"error", "Field 'items' must be an array."}};
                    res.status = 400;
                    res.set_content(err.dump(), "application/json");
                    return;
                }

                for (const auto& jItem : body["items"]) {
                    if (!jItem.contains("id") || !jItem.contains("name") ||
                        !jItem.contains("cost") || !jItem.contains("value")) {
                        json err = {{"error", "Each item must have id, name, cost, and value fields."}};
                        res.status = 400;
                        res.set_content(err.dump(), "application/json");
                        return;
                    }

                    spendsmart::Item item;
                    item.id = jItem["id"].get<std::string>();
                    item.name = jItem["name"].get<std::string>();
                    item.cost = jItem["cost"].get<int>();
                    item.value = jItem["value"].get<int>();

                    items.push_back(item);
                }
            }

            std::cout << "  -> Solving 0/1 Knapsack for budget ₹" << budget 
                      << " with " << items.size() << " candidate items...\n";

            // Run the actual C++ 0/1 Knapsack DP algorithm
            spendsmart::OptimizationResult result = spendsmart::solveKnapsack(budget, items);

            std::cout << "  -> Solved in " << result.executionTimeMs << " ms! "
                      << "Selected " << result.selectedItems.size() 
                      << " items, total value: " << result.totalValue
                      << ", total cost: ₹" << result.totalCost << "\n";

            json responseJson = spendsmart::toJson(result);
            res.status = 200;
            res.set_content(responseJson.dump(), "application/json");

        } catch (const json::parse_error& e) {
            std::cerr << "  -> JSON Parse Error: " << e.what() << "\n";
            json err = {{"error", std::string("Malformed JSON body: ") + e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        } catch (const std::invalid_argument& e) {
            std::cerr << "  -> Validation Error: " << e.what() << "\n";
            json err = {{"error", e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        } catch (const std::exception& e) {
            std::cerr << "  -> Unexpected Server Error: " << e.what() << "\n";
            json err = {{"error", std::string("Server error: ") + e.what()}};
            res.status = 500;
            res.set_content(err.dump(), "application/json");
        }
    });

    std::cout << "========================================================\n";
    std::cout << " SpendSmart C++ 0/1 Knapsack Server started on port " << port << "\n";
    std::cout << " Health: http://localhost:" << port << "/api/health\n";
    std::cout << " Optimize: POST http://localhost:" << port << "/api/optimize\n";
    std::cout << "========================================================\n";

    if (!svr.listen("0.0.0.0", port)) {
        std::cerr << "Failed to start C++ HTTP server on port " << port << "!\n";
        return 1;
    }

    return 0;
}
