<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->integer("total")->nullable();
            $table->integer("used")->nullable();
            $table->integer("available")->nullable();
            $table->unsignedBigInteger('app_type_id')->nullable();
            $table->dateTime('inserted_at')->nullable();
            $table->foreign('app_type_id')->references('id')->on('app')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};
